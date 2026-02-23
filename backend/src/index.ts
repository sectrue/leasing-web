import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import dayjs from "dayjs";
import fs from "fs/promises";
import path from "path";
import { createReadStream } from "fs";

dotenv.config();

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

type JwtPayload = { id: number; username: string; role: string };
type RequestWithAzienda = { aziendaId?: number };

const SABATINI_STATI = new Set([
  "bozza",
  "inviata",
  "ammessa",
  "respinta",
  "in_rendicontazione",
  "liquidata",
  "chiusa"
]);

const SABATINI_EROGAZIONI_STATI = new Set(["prevista", "richiesta", "pagata", "sospesa"]);

const SABATINI_EVENTI_TIPI = new Set([
  "invio_domanda",
  "richiesta_integrazione",
  "ammissione",
  "stipula",
  "consegna",
  "rendicontazione_inviata",
  "erogazione",
  "chiusura"
]);

const parseDate = (v: any) => (v ? new Date(v) : null);
const parseNum = (v: any) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const parseIntMaybe = (v: any) => {
  const n = parseNum(v);
  if (n === null) return null;
  const i = Math.trunc(n);
  return Number.isFinite(i) ? i : null;
};

const cleanString = (v: any) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s || null;
};

function isValidDateValue(v: any) {
  if (!v) return false;
  const d = new Date(v);
  return !Number.isNaN(d.getTime());
}

function validateSabatiniForState(body: any, sabatini: boolean, sabatiniStato: string | null) {
  if (sabatiniStato && !sabatini) {
    return "Imposta Sabatini attiva per usare uno stato Sabatini.";
  }
  if (sabatini && !sabatiniStato) {
    return "Stato Sabatini obbligatorio quando Sabatini e' attiva.";
  }
  if (!sabatini || !sabatiniStato) return null;

  const hasText = (v: any) => !!cleanString(v);
  const hasDate = (v: any) => isValidDateValue(v);
  const hasNum = (v: any) => parseNum(v) !== null;

  const missing: string[] = [];
  const requireForState = (state: string, checks: Array<[boolean, string]>) => {
    if (sabatiniStato !== state) return;
    for (const [ok, label] of checks) {
      if (!ok) missing.push(label);
    }
  };

  requireForState("inviata", [
    [hasText(body?.protocollo_domanda), "protocollo_domanda"],
    [hasDate(body?.data_domanda), "data_domanda"]
  ]);
  requireForState("ammessa", [
    [hasText(body?.protocollo_domanda), "protocollo_domanda"],
    [hasDate(body?.data_domanda), "data_domanda"],
    [hasText(body?.decreto_numero), "decreto_numero"],
    [hasDate(body?.decreto_data), "decreto_data"]
  ]);
  requireForState("respinta", [
    [hasDate(body?.data_domanda), "data_domanda"],
    [hasText(body?.note_sabatini), "note_sabatini"]
  ]);
  requireForState("liquidata", []);

  const numericFields = ["importo_sabatini"];
  for (const f of numericFields) {
    const n = parseNum(body?.[f]);
    if (n !== null && n < 0) return `${f} non puo' essere negativo`;
  }

  if (missing.length) {
    return `Campi obbligatori mancanti per stato '${sabatiniStato}': ${missing.join(", ")}`;
  }
  return null;
}

async function requireAuth(request: any, reply: any) {
  try {
    const auth = request.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return reply.code(401).send({ error: "Missing token" });
    const payload = await app.jwt.verify(token);
    request.user = payload as JwtPayload;
  } catch {
    return reply.code(401).send({ error: "Invalid token" });
  }
}

async function requireAzienda(request: any, reply: any) {
  const raw = request.headers["x-azienda-id"] ?? request.headers["x-azienda"];
  const aziendaId = parseIntMaybe(raw);
  if (!aziendaId) return reply.code(400).send({ error: "Azienda mancante" });

  const azienda = await prisma.aziende.findUnique({ where: { id: aziendaId } });
  if (!azienda) return reply.code(400).send({ error: "Azienda non valida" });

  (request as RequestWithAzienda).aziendaId = aziendaId;
}

function requireRole(roles: string[]) {
  return async (request: any, reply: any) => {
    const user = request.user as JwtPayload | undefined;
    if (!user) return reply.code(401).send({ error: "Unauthorized" });
    if (!roles.includes(user.role)) {
      return reply.code(403).send({ error: "Forbidden" });
    }
  };
}

async function start() {
  await app.register(cors, {
    origin: true,
    credentials: true
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "change_this_in_prod"
  });

  await app.register(multipart, {
    limits: { fileSize: 50 * 1024 * 1024 }
  });

  app.get("/health", async () => ({ ok: true }));

  app.post("/auth/login", async (request, reply) => {
    const body = request.body as { username?: string; password?: string };
    const username = (body?.username || "").trim();
    const password = body?.password || "";

    if (!username || !password) {
      return reply.code(400).send({ error: "Username e password obbligatori" });
    }

    const user = await prisma.users.findUnique({ where: { username } });
    if (!user) return reply.code(401).send({ error: "Credenziali non valide" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return reply.code(401).send({ error: "Credenziali non valide" });

    const token = await app.jwt.sign(
      { id: user.id, username: user.username, role: user.role } as JwtPayload,
      { expiresIn: "8h" }
    );

    return reply.send({ token, user: { id: user.id, username: user.username, role: user.role } });
  });

  app.get("/auth/me", { preHandler: [requireAuth] }, async (request) => {
    const user = request.user as JwtPayload;
    return { id: user.id, username: user.username, role: user.role };
  });

  app.get("/aziende", { preHandler: [requireAuth] }, async () => {
    return prisma.aziende.findMany({ orderBy: { id: "asc" } });
  });

  app.put("/aziende/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    const id = Number((request.params as any)?.id || 0);
    if (!id) return reply.code(400).send({ error: "Azienda non valida" });

    const nome = cleanString((request.body as any)?.nome);
    if (!nome) return reply.code(400).send({ error: "Nome azienda obbligatorio" });

    const existing = await prisma.aziende.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Azienda non trovata" });

    const updated = await prisma.aziende.update({
      where: { id },
      data: { nome }
    });
    return updated;
  });

  const praticaPublicSelect = {
    id: true,
    nr_ctr: true,
    leasing: true,
    societa_leasing_id: true,
    broker: true,
    data_inizio: true,
    data_fine: true,
    durata: true,
    importo_rata: true,
    importo_anticipo: true,
    importo_riscatto: true,
    created_at: true,
    updated_at: true,
    sabatini: true,
    importo_sabatini: true,
    sabatini_data: true,
    sabatini_stato: true,
    protocollo_domanda: true,
    data_domanda: true,
    cup: true,
    decreto_numero: true,
    decreto_data: true,
    cor_id: true,
    contributo_tipo: true,
    contributo_teorico_tot: true,
    contributo_ammesso_tot: true,
    note_sabatini: true,
    data_stipula_prevista: true,
    data_stipula_effettiva: true,
    data_consegna_prevista: true,
    data_consegna_effettiva: true,
    data_rendicontazione_scadenza: true,
    data_rendicontazione_inviata: true,
    data_erogazione_prevista: true,
    data_erogazione_effettiva: true
  };

  app.get("/pratiche", { preHandler: [requireAuth, requireAzienda] }, async (request) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const query = request.query as {
      limit?: string;
      page?: string;
      pageSize?: string;
      q?: string;
      sabatini?: string;
      status?: string;
      praticaId?: string;
      leasing?: string;
      broker?: string;
    };
    const limit = Math.min(Number(query?.limit || 50), 200);
    const page = Math.max(Number(query?.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(query?.pageSize || limit), 5), 200);
    const q = (query?.q || "").trim();
    const sabatini = (query?.sabatini || "").toLowerCase();
    const status = (query?.status || "").toLowerCase();
    const praticaId = Number(query?.praticaId || 0);
    const leasing = (query?.leasing || "").trim();
    const broker = (query?.broker || "").trim();
    const today = dayjs().startOf("day").toDate();

    const where: any = { azienda_id: aziendaId };
    if (q) {
      where.OR = [
        { nr_ctr: { contains: q } },
        { leasing: { contains: q } },
        { broker: { contains: q } }
      ];
    }
    if (sabatini === "true" || sabatini === "1") {
      where.sabatini = true;
    }
    if (praticaId) {
      where.id = praticaId;
    }
    if (leasing) {
      where.leasing = leasing;
    }
    if (broker) {
      where.broker = broker;
    }
    if (status === "attiva") {
      where.AND = [
        { data_inizio: { not: null } },
        { OR: [{ data_fine: null }, { data_fine: { gt: today } }] }
      ];
    } else if (status === "chiusa") {
      where.data_fine = { lte: today };
    } else if (status === "lavorazione") {
      where.AND = [{ data_inizio: null }, { data_fine: null }];
    }

    const [totalCount, pratiche] = await Promise.all([
      prisma.leasing_pratiche.count({ where }),
      prisma.leasing_pratiche.findMany({
        where,
        select: praticaPublicSelect,
        orderBy: { id: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    const societaIds = Array.from(
      new Set(
        pratiche
          .map((p: any) => p.societa_leasing_id)
          .filter((v: any): v is number => typeof v === "number" && Number.isFinite(v))
      )
    );
    const societaRows = societaIds.length
      ? await prisma.societa_leasing.findMany({
          where: { id: { in: societaIds } },
          select: { id: true, nome: true }
        })
      : [];
    const societaById = new Map(societaRows.map((r: any) => [r.id, r.nome]));

    const ids = pratiche.map((p: any) => p.id);
    const aggregates = ids.length
      ? await prisma.leasing_contracts.groupBy({
          by: ["pratica_id"],
          where: { pratica_id: { in: ids }, azienda_id: aziendaId },
          _sum: { importo_finanziato: true },
          _count: { id: true }
        })
      : [];

    const byPraticaId = new Map<number, { total: any; count: number }>(
      aggregates.map((a: any) => [
        a.pratica_id,
        {
          total: a?._sum?.importo_finanziato ?? null,
          count: Number(a?._count?.id || 0)
        }
      ])
    );

    const rows = pratiche.map((p: any) => {
      const agg = byPraticaId.get(p.id);
      const total = agg?.total ?? null;
      const count = agg?.count ?? 0;

      let stato = "In lavorazione";
      if (p.data_fine) {
        stato = dayjs(p.data_fine).isBefore(today, "day") || dayjs(p.data_fine).isSame(today, "day")
          ? "Chiusa"
          : "Attiva";
      } else if (p.data_inizio) {
        stato = "Attiva";
      }

      return {
        id: p.id,
        nr_ctr: p.nr_ctr,
        leasing: p.leasing || (p.societa_leasing_id ? societaById.get(p.societa_leasing_id) || null : null),
        societa_leasing_id: p.societa_leasing_id,
        societa_leasing_nome: p.societa_leasing_id ? societaById.get(p.societa_leasing_id) || null : null,
        broker: p.broker,
        data_inizio: p.data_inizio,
        data_fine: p.data_fine,
        sabatini: p.sabatini,
        sabatini_stato: p.sabatini_stato,
        mezzi_count: count,
        total_importo_finanziato: total ? total.toString() : "0",
        stato
      };
    });

    return {
      items: rows,
      total: totalCount,
      page,
      pageSize
    };
  });

  app.get("/kpi", { preHandler: [requireAuth, requireAzienda] }, async (request) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const today = dayjs().startOf("day").toDate();
    const in30Days = dayjs().add(30, "day").endOf("day").toDate();
    const last30Days = dayjs().subtract(30, "day").startOf("day").toDate();
    const [totalPratiche, activePratiche, sabatiniPratiche] = await Promise.all([
      prisma.leasing_pratiche.count({ where: { azienda_id: aziendaId } }),
      prisma.leasing_pratiche.count({
        where: {
          azienda_id: aziendaId,
          data_inizio: { not: null },
          OR: [{ data_fine: null }, { data_fine: { gt: today } }]
        }
      }),
      prisma.leasing_pratiche.count({ where: { azienda_id: aziendaId, sabatini: true } })
    ]);

    const [chiusePratiche, inLavorazionePratiche, inScadenza30] = await Promise.all([
      prisma.leasing_pratiche.count({ where: { azienda_id: aziendaId, data_fine: { lte: today } } }),
      prisma.leasing_pratiche.count({
        where: { azienda_id: aziendaId, data_inizio: null, data_fine: null }
      }),
      prisma.leasing_pratiche.count({
        where: {
          azienda_id: aziendaId,
          data_fine: { gte: today, lte: in30Days }
        }
      })
    ]);

    const contrattiUltimi30 = await prisma.leasing_contracts.count({
      where: { azienda_id: aziendaId, data_inizio: { gte: last30Days } }
    });

    const importoAgg = await prisma.leasing_contracts.aggregate({
      where: { azienda_id: aziendaId },
      _sum: { importo_finanziato: true },
      _avg: { importo_finanziato: true }
    });

    return {
      pratiche_totali: totalPratiche,
      pratiche_attive: activePratiche,
      pratiche_in_lavorazione: inLavorazionePratiche,
      pratiche_chiuse: chiusePratiche,
      pratiche_in_scadenza_30g: inScadenza30,
      contratti_ultimi_30g: contrattiUltimi30,
      sabatini_percent: totalPratiche > 0 ? Math.round((sabatiniPratiche / totalPratiche) * 100) : 0,
      importo_totale: importoAgg._sum.importo_finanziato
        ? importoAgg._sum.importo_finanziato.toString()
        : "0",
      importo_medio: importoAgg._avg.importo_finanziato
        ? importoAgg._avg.importo_finanziato.toString()
        : "0"
    };
  });

  app.get("/stats/monthly", { preHandler: [requireAuth, requireAzienda] }, async (request) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const rows = await prisma.$queryRaw<
      { ym: string; total: any; count: any }[]
    >`
      SELECT DATE_FORMAT(data_inizio, '%Y-%m') as ym,
             SUM(importo_finanziato) as total,
             COUNT(*) as count
      FROM leasing_contracts
      WHERE data_inizio IS NOT NULL
        AND data_inizio >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        AND azienda_id = ${aziendaId}
      GROUP BY ym
      ORDER BY ym ASC
    `;

    return rows.map((r: { ym: string; total: any; count: any }) => ({
      ym: r.ym,
      total: r.total ? r.total.toString() : "0",
      count: Number(r.count || 0)
    }));
  });

  app.get("/filters/pratiche", { preHandler: [requireAuth, requireAzienda] }, async (request) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const pratiche = await prisma.leasing_pratiche.findMany({
      where: { azienda_id: aziendaId },
      orderBy: { id: "desc" },
      take: 200,
      select: {
        id: true,
        nr_ctr: true,
        leasing: true,
        societa_leasing_id: true,
        broker: true
      }
    });
    return pratiche;
  });

  app.get("/filters/leasing", { preHandler: [requireAuth, requireAzienda] }, async (request) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const [societaRows, legacyRows] = await Promise.all([
      prisma.societa_leasing.findMany({
        where: { azienda_id: aziendaId },
        orderBy: { nome: "asc" },
        select: { nome: true }
      }),
      prisma.leasing_pratiche.findMany({
        distinct: ["leasing"],
        select: { leasing: true },
        where: { azienda_id: aziendaId, leasing: { not: null } }
      })
    ]);
    const values = new Set<string>();
    for (const row of societaRows) {
      const v = row.nome?.trim();
      if (v) values.add(v);
    }
    for (const row of legacyRows) {
      const v = row.leasing?.trim();
      if (v) values.add(v);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, "it"));
  });

  app.get("/societa-leasing", { preHandler: [requireAuth, requireAzienda] }, async (request) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const rows = await prisma.societa_leasing.findMany({
      where: { azienda_id: aziendaId },
      orderBy: { nome: "asc" }
    });
    return rows;
  });

  app.post("/societa-leasing", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const body = request.body as any;
    const nome = cleanString(body?.nome);
    if (!nome) return reply.code(400).send({ error: "Nome societa obbligatorio" });

    const created = await prisma.societa_leasing.create({
      data: {
        azienda_id: aziendaId,
        nome,
        referente: cleanString(body?.referente),
        telefono: cleanString(body?.telefono),
        email: cleanString(body?.email),
        note: cleanString(body?.note)
      }
    });
    return created;
  });

  app.put("/societa-leasing/:id", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const id = Number((request.params as any)?.id || 0);
    if (!id) return reply.code(400).send({ error: "Societa non valida" });

    const existing = await prisma.societa_leasing.findFirst({ where: { id, azienda_id: aziendaId } });
    if (!existing) return reply.code(404).send({ error: "Societa non trovata" });

    const body = request.body as any;
    const nome = body?.nome === undefined ? existing.nome : cleanString(body?.nome);
    if (!nome) return reply.code(400).send({ error: "Nome societa obbligatorio" });

    const updated = await prisma.societa_leasing.update({
      where: { id },
      data: {
        nome,
        referente: body?.referente === undefined ? existing.referente : cleanString(body?.referente),
        telefono: body?.telefono === undefined ? existing.telefono : cleanString(body?.telefono),
        email: body?.email === undefined ? existing.email : cleanString(body?.email),
        note: body?.note === undefined ? existing.note : cleanString(body?.note)
      }
    });
    return updated;
  });

  app.delete("/societa-leasing/:id", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const id = Number((request.params as any)?.id || 0);
    if (!id) return reply.code(400).send({ error: "Societa non valida" });

    const existing = await prisma.societa_leasing.findFirst({ where: { id, azienda_id: aziendaId } });
    if (!existing) return reply.code(404).send({ error: "Societa non trovata" });

    const linkedCount = await prisma.leasing_pratiche.count({
      where: { societa_leasing_id: id, azienda_id: aziendaId }
    });
    if (linkedCount > 0) {
      return reply.code(400).send({
        error: "Impossibile eliminare: societa collegata a pratiche esistenti"
      });
    }

    await prisma.societa_leasing.delete({ where: { id } });
    return { ok: true };
  });

  app.get("/filters/brokers", { preHandler: [requireAuth, requireAzienda] }, async (request) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const rows = await prisma.leasing_pratiche.findMany({
      distinct: ["broker"],
      select: { broker: true },
      where: { azienda_id: aziendaId, broker: { not: null } }
    });
    return rows.map((r: any) => r.broker).filter((v: any) => v && v.trim());
  });

  app.post("/pratiche", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const body = request.body as any;
    const leasing = (body?.leasing || "").trim();
    const broker = (body?.broker || "").trim();
    const nrCtr = (body?.nr_ctr || "").trim();
    const societaLeasingId = parseIntMaybe(body?.societa_leasing_id);
    const societaLeasing = societaLeasingId
      ? await prisma.societa_leasing.findFirst({
          where: { id: societaLeasingId, azienda_id: aziendaId },
          select: { id: true, nome: true }
        })
      : null;
    if (body?.societa_leasing_id && !societaLeasing) {
      return reply.code(400).send({ error: "Societa leasing non valida" });
    }
    const leasingResolved = leasing || societaLeasing?.nome || "";

    if (!leasingResolved && !broker && !nrCtr) {
      return reply.code(400).send({ error: "Compila almeno Leasing, Broker o Nr Contratto." });
    }

    const sabatiniStato = cleanString(body?.sabatini_stato)?.toLowerCase();
    if (sabatiniStato && !SABATINI_STATI.has(sabatiniStato)) {
      return reply.code(400).send({ error: "Stato Sabatini non valido" });
    }
    const sabatiniValidationError = validateSabatiniForState(body, Boolean(body?.sabatini), sabatiniStato || null);
    if (sabatiniValidationError) {
      return reply.code(400).send({ error: sabatiniValidationError });
    }

    const created = await prisma.leasing_pratiche.create({
      select: praticaPublicSelect,
      data: {
        azienda_id: aziendaId,
        leasing: leasingResolved || null,
        societa_leasing_id: societaLeasing?.id || null,
        broker: broker || null,
        nr_ctr: nrCtr || null,
        data_inizio: parseDate(body?.data_inizio),
        data_fine: parseDate(body?.data_fine),
        durata: parseNum(body?.durata),
        importo_rata: parseNum(body?.importo_rata),
        importo_anticipo: parseNum(body?.importo_anticipo),
        importo_riscatto: parseNum(body?.importo_riscatto),
        sabatini: Boolean(body?.sabatini),
        importo_sabatini: body?.sabatini ? parseNum(body?.importo_sabatini) : null,
        sabatini_data: body?.sabatini ? parseDate(body?.sabatini_data) : null,
        sabatini_stato: sabatiniStato,
        protocollo_domanda: cleanString(body?.protocollo_domanda),
        data_domanda: parseDate(body?.data_domanda),
        cup: cleanString(body?.cup),
        decreto_numero: cleanString(body?.decreto_numero),
        decreto_data: parseDate(body?.decreto_data),
        cor_id: cleanString(body?.cor_id),
        contributo_tipo: cleanString(body?.contributo_tipo),
        contributo_teorico_tot: parseNum(body?.contributo_teorico_tot),
        contributo_ammesso_tot: parseNum(body?.contributo_ammesso_tot),
        note_sabatini: cleanString(body?.note_sabatini),
        data_stipula_prevista: parseDate(body?.data_stipula_prevista),
        data_stipula_effettiva: parseDate(body?.data_stipula_effettiva),
        data_consegna_prevista: parseDate(body?.data_consegna_prevista),
        data_consegna_effettiva: parseDate(body?.data_consegna_effettiva),
        data_rendicontazione_scadenza: parseDate(body?.data_rendicontazione_scadenza),
        data_rendicontazione_inviata: parseDate(body?.data_rendicontazione_inviata),
        data_erogazione_prevista: parseDate(body?.data_erogazione_prevista),
        data_erogazione_effettiva: parseDate(body?.data_erogazione_effettiva)
      }
    });

    return created;
  });

  app.get("/pratiche/:id", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const praticaId = Number((request.params as any)?.id || 0);
    if (!praticaId) return reply.code(400).send({ error: "Pratica non valida" });

    const pratica = await prisma.leasing_pratiche.findFirst({
      where: { id: praticaId, azienda_id: aziendaId },
      select: praticaPublicSelect
    });
    if (!pratica) return reply.code(404).send({ error: "Pratica non trovata" });
    return pratica;
  });

  app.put("/pratiche/:id", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const praticaId = Number((request.params as any)?.id || 0);
    if (!praticaId) return reply.code(400).send({ error: "Pratica non valida" });

    const existingPratica = await prisma.leasing_pratiche.findFirst({
      where: { id: praticaId, azienda_id: aziendaId }
    });
    if (!existingPratica) return reply.code(404).send({ error: "Pratica non trovata" });

    const body = request.body as any;
    const leasing = (body?.leasing || "").trim();
    const broker = (body?.broker || "").trim();
    const nrCtr = (body?.nr_ctr || "").trim();
    const societaLeasingId = parseIntMaybe(body?.societa_leasing_id);
    const societaLeasing = societaLeasingId
      ? await prisma.societa_leasing.findFirst({
          where: { id: societaLeasingId, azienda_id: aziendaId },
          select: { id: true, nome: true }
        })
      : null;
    if (body?.societa_leasing_id && !societaLeasing) {
      return reply.code(400).send({ error: "Societa leasing non valida" });
    }
    const leasingResolved = leasing || societaLeasing?.nome || "";

    if (!leasingResolved && !broker && !nrCtr) {
      return reply.code(400).send({ error: "Compila almeno Leasing, Broker o Nr Contratto." });
    }

    const sabatiniStato = cleanString(body?.sabatini_stato)?.toLowerCase();
    if (sabatiniStato && !SABATINI_STATI.has(sabatiniStato)) {
      return reply.code(400).send({ error: "Stato Sabatini non valido" });
    }
    const sabatiniValidationError = validateSabatiniForState(body, Boolean(body?.sabatini), sabatiniStato || null);
    if (sabatiniValidationError) {
      return reply.code(400).send({ error: sabatiniValidationError });
    }
    if (sabatiniStato === "liquidata") {
      const erogazioniCount = await prisma.sabatini_erogazioni.count({
        where: { pratica_id: praticaId, azienda_id: aziendaId }
      });
      if (erogazioniCount === 0) {
        return reply.code(400).send({
          error: "Per stato 'liquidata' serve almeno una erogazione registrata."
        });
      }
    }

    const updated = await prisma.leasing_pratiche.update({
      where: { id: praticaId },
      select: praticaPublicSelect,
      data: {
        leasing: leasingResolved || null,
        societa_leasing_id: societaLeasing?.id || null,
        broker: broker || null,
        nr_ctr: nrCtr || null,
        data_inizio: parseDate(body?.data_inizio),
        data_fine: parseDate(body?.data_fine),
        durata: parseNum(body?.durata),
        importo_rata: parseNum(body?.importo_rata),
        importo_anticipo: parseNum(body?.importo_anticipo),
        importo_riscatto: parseNum(body?.importo_riscatto),
        sabatini: Boolean(body?.sabatini),
        importo_sabatini: body?.sabatini ? parseNum(body?.importo_sabatini) : null,
        sabatini_data: body?.sabatini ? parseDate(body?.sabatini_data) : null,
        sabatini_stato: sabatiniStato,
        protocollo_domanda: cleanString(body?.protocollo_domanda),
        data_domanda: parseDate(body?.data_domanda),
        cup: cleanString(body?.cup),
        decreto_numero: cleanString(body?.decreto_numero),
        decreto_data: parseDate(body?.decreto_data),
        cor_id: cleanString(body?.cor_id),
        contributo_tipo: cleanString(body?.contributo_tipo),
        contributo_teorico_tot: parseNum(body?.contributo_teorico_tot),
        contributo_ammesso_tot: parseNum(body?.contributo_ammesso_tot),
        note_sabatini: cleanString(body?.note_sabatini),
        data_stipula_prevista: parseDate(body?.data_stipula_prevista),
        data_stipula_effettiva: parseDate(body?.data_stipula_effettiva),
        data_consegna_prevista: parseDate(body?.data_consegna_prevista),
        data_consegna_effettiva: parseDate(body?.data_consegna_effettiva),
        data_rendicontazione_scadenza: parseDate(body?.data_rendicontazione_scadenza),
        data_rendicontazione_inviata: parseDate(body?.data_rendicontazione_inviata),
        data_erogazione_prevista: parseDate(body?.data_erogazione_prevista),
        data_erogazione_effettiva: parseDate(body?.data_erogazione_effettiva)
      }
    });

    return updated;
  });

  app.delete("/pratiche/:id", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const praticaId = Number((request.params as any)?.id || 0);
    if (!praticaId) return reply.code(400).send({ error: "Pratica non valida" });

    const query = request.query as { deleteMezzi?: string };
    const deleteMezzi =
      String(query?.deleteMezzi || "").toLowerCase() === "true" ||
      String(query?.deleteMezzi || "") === "1";

    const pratica = await prisma.leasing_pratiche.findFirst({
      where: { id: praticaId, azienda_id: aziendaId }
    });
    if (!pratica) return reply.code(404).send({ error: "Pratica non trovata" });

    const mezziCount = await prisma.leasing_contracts.count({
      where: { pratica_id: praticaId, azienda_id: aziendaId }
    });
    const attachments = await prisma.leasing_pratiche_attachments.findMany({
      where: { pratica_id: praticaId, azienda_id: aziendaId }
    });

    for (const att of attachments) {
      try {
        await fs.unlink(att.stored_path);
      } catch {
        // ignore filesystem errors
      }
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.leasing_pratiche_attachments.deleteMany({
        where: { pratica_id: praticaId, azienda_id: aziendaId }
      });
      await tx.sabatini_erogazioni.deleteMany({ where: { pratica_id: praticaId, azienda_id: aziendaId } });
      await tx.sabatini_eventi.deleteMany({ where: { pratica_id: praticaId, azienda_id: aziendaId } });

      if (deleteMezzi) {
        await tx.leasing_contracts.deleteMany({ where: { pratica_id: praticaId, azienda_id: aziendaId } });
      } else {
        await tx.leasing_contracts.updateMany({
          where: { pratica_id: praticaId, azienda_id: aziendaId },
          data: { pratica_id: null }
        });
      }

      await tx.leasing_pratiche.delete({ where: { id: praticaId } });
    });

    return {
      ok: true,
      deletedPraticaId: praticaId,
      deletedMezzi: deleteMezzi ? mezziCount : 0,
      unlinkedMezzi: deleteMezzi ? 0 : mezziCount
    };
  });

  app.get("/pratiche/:id/sabatini/erogazioni", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const praticaId = Number((request.params as any)?.id || 0);
    if (!praticaId) return reply.code(400).send({ error: "Pratica non valida" });

    const pratica = await prisma.leasing_pratiche.findFirst({
      where: { id: praticaId, azienda_id: aziendaId }
    });
    if (!pratica) return reply.code(404).send({ error: "Pratica non trovata" });

    const items = await prisma.sabatini_erogazioni.findMany({
      where: { pratica_id: praticaId, azienda_id: aziendaId },
      orderBy: [{ numero_rata: "asc" }, { id: "asc" }]
    });
    return items;
  });

  app.post("/pratiche/:id/sabatini/erogazioni", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const praticaId = Number((request.params as any)?.id || 0);
    if (!praticaId) return reply.code(400).send({ error: "Pratica non valida" });

    const pratica = await prisma.leasing_pratiche.findFirst({
      where: { id: praticaId, azienda_id: aziendaId }
    });
    if (!pratica) return reply.code(404).send({ error: "Pratica non trovata" });

    const body = request.body as any;
    const stato = cleanString(body?.stato)?.toLowerCase() || "pagata";
    if (!SABATINI_EROGAZIONI_STATI.has(stato)) {
      return reply.code(400).send({ error: "Stato erogazione non valido" });
    }

    const created = await prisma.sabatini_erogazioni.create({
      data: {
        azienda_id: aziendaId,
        pratica_id: praticaId,
        numero_rata: parseIntMaybe(body?.numero_rata),
        importo: parseNum(body?.importo),
        data_prevista: parseDate(body?.data_prevista),
        data_pagata: parseDate(body?.data_pagata),
        stato,
        note: cleanString(body?.note)
      }
    });

    return created;
  });

  app.put("/sabatini/erogazioni/:id", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const erogazioneId = Number((request.params as any)?.id || 0);
    if (!erogazioneId) return reply.code(400).send({ error: "Erogazione non valida" });

    const existing = await prisma.sabatini_erogazioni.findFirst({
      where: { id: erogazioneId, azienda_id: aziendaId }
    });
    if (!existing) return reply.code(404).send({ error: "Erogazione non trovata" });

    const body = request.body as any;
    const stato = cleanString(body?.stato)?.toLowerCase() || existing.stato;
    if (!SABATINI_EROGAZIONI_STATI.has(stato)) {
      return reply.code(400).send({ error: "Stato erogazione non valido" });
    }

    const updated = await prisma.sabatini_erogazioni.update({
      where: { id: erogazioneId },
      data: {
        numero_rata:
          body?.numero_rata === undefined ? existing.numero_rata : parseIntMaybe(body?.numero_rata),
        importo: body?.importo === undefined ? existing.importo : parseNum(body?.importo),
        data_prevista:
          body?.data_prevista === undefined ? existing.data_prevista : parseDate(body?.data_prevista),
        data_pagata: body?.data_pagata === undefined ? existing.data_pagata : parseDate(body?.data_pagata),
        stato,
        note: body?.note === undefined ? existing.note : cleanString(body?.note)
      }
    });

    return updated;
  });

  app.delete("/sabatini/erogazioni/:id", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const erogazioneId = Number((request.params as any)?.id || 0);
    if (!erogazioneId) return reply.code(400).send({ error: "Erogazione non valida" });

    const existing = await prisma.sabatini_erogazioni.findFirst({
      where: { id: erogazioneId, azienda_id: aziendaId }
    });
    if (!existing) return reply.code(404).send({ error: "Erogazione non trovata" });

    await prisma.sabatini_erogazioni.delete({ where: { id: erogazioneId } });
    return { ok: true };
  });

  app.get("/pratiche/:id/sabatini/eventi", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const praticaId = Number((request.params as any)?.id || 0);
    if (!praticaId) return reply.code(400).send({ error: "Pratica non valida" });

    const pratica = await prisma.leasing_pratiche.findFirst({
      where: { id: praticaId, azienda_id: aziendaId }
    });
    if (!pratica) return reply.code(404).send({ error: "Pratica non trovata" });

    const items = await prisma.sabatini_eventi.findMany({
      where: { pratica_id: praticaId, azienda_id: aziendaId },
      orderBy: [{ data_evento: "desc" }, { id: "desc" }]
    });
    return items;
  });

  app.post("/pratiche/:id/sabatini/eventi", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const praticaId = Number((request.params as any)?.id || 0);
    if (!praticaId) return reply.code(400).send({ error: "Pratica non valida" });

    const pratica = await prisma.leasing_pratiche.findFirst({
      where: { id: praticaId, azienda_id: aziendaId }
    });
    if (!pratica) return reply.code(404).send({ error: "Pratica non trovata" });

    const body = request.body as any;
    const tipo = cleanString(body?.tipo)?.toLowerCase();
    if (!tipo || !SABATINI_EVENTI_TIPI.has(tipo)) {
      return reply.code(400).send({ error: "Tipo evento non valido" });
    }

    const user = request.user as JwtPayload;
    const created = await prisma.sabatini_eventi.create({
      data: {
        azienda_id: aziendaId,
        pratica_id: praticaId,
        data_evento: parseDate(body?.data_evento) || new Date(),
        tipo,
        descrizione: cleanString(body?.descrizione),
        utente_id: body?.utente_id !== undefined ? parseIntMaybe(body?.utente_id) : user?.id
      }
    });
    return created;
  });

  app.put("/sabatini/eventi/:id", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const eventoId = Number((request.params as any)?.id || 0);
    if (!eventoId) return reply.code(400).send({ error: "Evento non valido" });

    const existing = await prisma.sabatini_eventi.findFirst({
      where: { id: eventoId, azienda_id: aziendaId }
    });
    if (!existing) return reply.code(404).send({ error: "Evento non trovato" });

    const body = request.body as any;
    const tipo = body?.tipo === undefined ? existing.tipo : cleanString(body?.tipo)?.toLowerCase();
    if (!tipo || !SABATINI_EVENTI_TIPI.has(tipo)) {
      return reply.code(400).send({ error: "Tipo evento non valido" });
    }

    const updated = await prisma.sabatini_eventi.update({
      where: { id: eventoId },
      data: {
        data_evento:
          body?.data_evento === undefined
            ? existing.data_evento
            : parseDate(body?.data_evento) || existing.data_evento,
        tipo,
        descrizione: body?.descrizione === undefined ? existing.descrizione : cleanString(body?.descrizione),
        utente_id: body?.utente_id === undefined ? existing.utente_id : parseIntMaybe(body?.utente_id)
      }
    });
    return updated;
  });

  app.delete("/sabatini/eventi/:id", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const eventoId = Number((request.params as any)?.id || 0);
    if (!eventoId) return reply.code(400).send({ error: "Evento non valido" });

    const existing = await prisma.sabatini_eventi.findFirst({
      where: { id: eventoId, azienda_id: aziendaId }
    });
    if (!existing) return reply.code(404).send({ error: "Evento non trovato" });

    await prisma.sabatini_eventi.delete({ where: { id: eventoId } });
    return { ok: true };
  });

  app.get("/pratiche/:id/attachments", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const praticaId = Number((request.params as any)?.id || 0);
    if (!praticaId) return reply.code(400).send({ error: "Pratica non valida" });

    const pratica = await prisma.leasing_pratiche.findFirst({
      where: { id: praticaId, azienda_id: aziendaId }
    });
    if (!pratica) return reply.code(404).send({ error: "Pratica non trovata" });

    const list = await prisma.leasing_pratiche_attachments.findMany({
      where: { pratica_id: praticaId, azienda_id: aziendaId },
      orderBy: { id: "desc" }
    });
    return list;
  });

  app.post("/pratiche/:id/attachments", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const praticaId = Number((request.params as any)?.id || 0);
    if (!praticaId) return reply.code(400).send({ error: "Pratica non valida" });

    const pratica = await prisma.leasing_pratiche.findFirst({
      where: { id: praticaId, azienda_id: aziendaId }
    });
    if (!pratica) return reply.code(404).send({ error: "Pratica non trovata" });

    const file = await (request as any).file();
    if (!file) return reply.code(400).send({ error: "File mancante" });

    const baseDir = process.env.NAS_ATTACHMENTS || path.join(process.cwd(), "attachments");
    const praticaDir = path.join(baseDir, `Azienda_${aziendaId}`, "Pratiche", `Pratica_${praticaId}`);
    await fs.mkdir(praticaDir, { recursive: true });

    const originalName = file.filename;
    const storedName = `${Date.now()}_${originalName}`;
    const storedPath = path.join(praticaDir, storedName);

    const buffer = await file.toBuffer();
    await fs.writeFile(storedPath, buffer);

    const record = await prisma.leasing_pratiche_attachments.create({
      data: {
        azienda_id: aziendaId,
        pratica_id: praticaId,
        original_name: originalName,
        stored_name: storedName,
        stored_path: storedPath
      }
    });

    return record;
  });

  app.delete("/pratiche/attachments/:id", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const attId = Number((request.params as any)?.id || 0);
    if (!attId) return reply.code(400).send({ error: "Allegato non valido" });

    const att = await prisma.leasing_pratiche_attachments.findFirst({
      where: { id: attId, azienda_id: aziendaId }
    });
    if (!att) return reply.code(404).send({ error: "Allegato non trovato" });

    try {
      await fs.unlink(att.stored_path);
    } catch {
      // ignore filesystem errors
    }

    await prisma.leasing_pratiche_attachments.delete({ where: { id: attId } });
    return { ok: true };
  });

  app.get("/pratiche/attachments/:id/download", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const attId = Number((request.params as any)?.id || 0);
    if (!attId) return reply.code(400).send({ error: "Allegato non valido" });

    const att = await prisma.leasing_pratiche_attachments.findFirst({
      where: { id: attId, azienda_id: aziendaId }
    });
    if (!att) return reply.code(404).send({ error: "Allegato non trovato" });

    try {
      await fs.access(att.stored_path);
    } catch {
      return reply.code(404).send({ error: "File non trovato" });
    }

    reply.header("Content-Disposition", `inline; filename="${att.original_name}"`);
    reply.header("Content-Type", "application/octet-stream");
    return reply.send(createReadStream(att.stored_path));
  });

  app.get("/pratiche/:id/mezzi", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const praticaId = Number((request.params as any)?.id || 0);
    if (!praticaId) return reply.code(400).send({ error: "Pratica non valida" });

    const pratica = await prisma.leasing_pratiche.findFirst({
      where: { id: praticaId, azienda_id: aziendaId }
    });
    if (!pratica) return reply.code(404).send({ error: "Pratica non trovata" });

    const mezzi = await prisma.leasing_contracts.findMany({
      where: { pratica_id: praticaId, azienda_id: aziendaId },
      orderBy: { id: "desc" }
    });

    return mezzi.map((m: any) => ({
      id: m.id,
      numero_interno: m.numero_interno,
      mezzo: m.mezzo,
      fornitore: m.fornitore,
      descrizione_bene: m.descrizione_bene,
      allestimento: m.allestimento,
      importo_mezzo: m.importo_mezzo,
      importo_allestimento_materiale: m.importo_allestimento_materiale,
      importo_pratica_40: m.importo_pratica_40,
      importo_finanziato: m.importo_finanziato,
      importo_totale_mezzo: m.importo_totale_mezzo,
      // backward compatibility fields (can be removed after client migration)
      importo: m.importo_mezzo,
      pratica_40: m.importo_pratica_40,
      importo_contratto: m.importo_totale_mezzo,
      note: m.note
    }));
  });

  app.post("/pratiche/:id/mezzi", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const praticaId = Number((request.params as any)?.id || 0);
    if (!praticaId) return reply.code(400).send({ error: "Pratica non valida" });

    const pratica = await prisma.leasing_pratiche.findFirst({
      where: { id: praticaId, azienda_id: aziendaId }
    });
    if (!pratica) return reply.code(404).send({ error: "Pratica non trovata" });

    const body = request.body as {
      numero_interno?: string;
      mezzo?: string;
      fornitore?: string;
      descrizione_bene?: string;
      allestimento?: string;
      importo_mezzo?: string | number;
      importo?: string | number;
      importo_allestimento_materiale?: string | number;
      importo_pratica_40?: string | number;
      pratica_40?: string | number;
      note?: string;
    };

    const numeroInterno = (body?.numero_interno || "").trim();
    const mezzo = (body?.mezzo || "").trim();
    if (!numeroInterno || !mezzo) {
      return reply.code(400).send({ error: "Numero interno e mezzo sono obbligatori" });
    }

    const parseMoney = (v: any): number => {
      if (v === null || v === undefined) return 0;
      if (typeof v === "number") return Number.isFinite(v) ? v : 0;
      let s = String(v).trim();
      if (!s) return 0;
      s = s.replace(/[€\s]/g, "");
      if (s.includes(".") && s.includes(",")) {
        s = s.replace(/\./g, "").replace(",", ".");
      } else if (s.includes(",")) {
        s = s.replace(",", ".");
      }
      const n = Number(s);
      return Number.isFinite(n) ? n : 0;
    };

    const importoMezzo = parseMoney(body?.importo_mezzo ?? body?.importo);
    const pratica40 = parseMoney(body?.importo_pratica_40 ?? body?.pratica_40);
    const allestimentoMateriale = parseMoney(body?.importo_allestimento_materiale);
    const importoFinanziato = importoMezzo + pratica40 + allestimentoMateriale;

    const created = await prisma.leasing_contracts.create({
      data: {
        azienda_id: aziendaId,
        pratica_id: praticaId,
        numero_interno: numeroInterno,
        mezzo,
        fornitore: body?.fornitore || null,
        descrizione_bene: body?.descrizione_bene || null,
        allestimento: body?.allestimento || null,
        importo_mezzo: importoMezzo,
        importo_allestimento_materiale: allestimentoMateriale,
        importo_pratica_40:
          body?.importo_pratica_40 !== undefined && body?.importo_pratica_40 !== null
            ? String(body?.importo_pratica_40)
            : body?.pratica_40 !== undefined && body?.pratica_40 !== null
              ? String(body?.pratica_40)
              : null,
        importo_finanziato: importoFinanziato,
        importo_totale_mezzo: importoFinanziato,
        note: body?.note || null
      }
    });

    return {
      id: created.id,
      numero_interno: created.numero_interno,
      mezzo: created.mezzo,
      importo_finanziato: created.importo_finanziato,
      importo_totale_mezzo: created.importo_totale_mezzo,
      importo_contratto: created.importo_totale_mezzo
    };
  });

  app.get("/mezzi/:id", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const mezzoId = Number((request.params as any)?.id || 0);
    if (!mezzoId) return reply.code(400).send({ error: "Mezzo non valido" });

    const m = await prisma.leasing_contracts.findFirst({
      where: { id: mezzoId, azienda_id: aziendaId }
    });
    if (!m) return reply.code(404).send({ error: "Mezzo non trovato" });

    return {
      id: m.id,
      pratica_id: m.pratica_id,
      numero_interno: m.numero_interno,
      mezzo: m.mezzo,
      fornitore: m.fornitore,
      descrizione_bene: m.descrizione_bene,
      allestimento: m.allestimento,
      importo_mezzo: m.importo_mezzo,
      importo_allestimento_materiale: m.importo_allestimento_materiale,
      importo_pratica_40: m.importo_pratica_40,
      importo_finanziato: m.importo_finanziato,
      importo_totale_mezzo: m.importo_totale_mezzo,
      // backward compatibility fields (can be removed after client migration)
      importo: m.importo_mezzo,
      pratica_40: m.importo_pratica_40,
      importo_contratto: m.importo_totale_mezzo,
      note: m.note
    };
  });

  app.put("/mezzi/:id", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const mezzoId = Number((request.params as any)?.id || 0);
    if (!mezzoId) return reply.code(400).send({ error: "Mezzo non valido" });

    const existing = await prisma.leasing_contracts.findFirst({
      where: { id: mezzoId, azienda_id: aziendaId }
    });
    if (!existing) return reply.code(404).send({ error: "Mezzo non trovato" });

    const body = request.body as {
      numero_interno?: string;
      mezzo?: string;
      fornitore?: string;
      descrizione_bene?: string;
      allestimento?: string;
      importo_mezzo?: string | number;
      importo?: string | number;
      importo_allestimento_materiale?: string | number;
      importo_pratica_40?: string | number;
      pratica_40?: string | number;
      pratica_id?: number | string | null;
      note?: string;
    };

    const numeroInterno = (body?.numero_interno || "").trim();
    const mezzo = (body?.mezzo || "").trim();
    if (!numeroInterno || !mezzo) {
      return reply.code(400).send({ error: "Numero interno e mezzo sono obbligatori" });
    }

    const parseMoney = (v: any): number => {
      if (v === null || v === undefined) return 0;
      if (typeof v === "number") return Number.isFinite(v) ? v : 0;
      let s = String(v).trim();
      if (!s) return 0;
      s = s.replace(/[€\s]/g, "");
      if (s.includes(".") && s.includes(",")) {
        s = s.replace(/\./g, "").replace(",", ".");
      } else if (s.includes(",")) {
        s = s.replace(",", ".");
      }
      const n = Number(s);
      return Number.isFinite(n) ? n : 0;
    };

    const importoMezzo = parseMoney(body?.importo_mezzo ?? body?.importo);
    const pratica40 = parseMoney(body?.importo_pratica_40 ?? body?.pratica_40);
    const allestimentoMateriale = parseMoney(body?.importo_allestimento_materiale);
    const importoFinanziato = importoMezzo + pratica40 + allestimentoMateriale;

    const praticaId =
      body?.pratica_id === null || body?.pratica_id === undefined || body?.pratica_id === ""
        ? null
        : Number(body?.pratica_id);
    if (Number.isFinite(praticaId as number)) {
      const pratica = await prisma.leasing_pratiche.findFirst({
        where: { id: praticaId as number, azienda_id: aziendaId }
      });
      if (!pratica) return reply.code(400).send({ error: "Pratica non valida per l'azienda selezionata" });
    }

    const updated = await prisma.leasing_contracts.update({
      where: { id: mezzoId },
      data: {
        azienda_id: aziendaId,
        pratica_id: Number.isFinite(praticaId as number) ? (praticaId as number) : null,
        numero_interno: numeroInterno,
        mezzo,
        fornitore: body?.fornitore || null,
        descrizione_bene: body?.descrizione_bene || null,
        allestimento: body?.allestimento || null,
        importo_mezzo: importoMezzo,
        importo_allestimento_materiale: allestimentoMateriale,
        importo_pratica_40:
          body?.importo_pratica_40 !== undefined && body?.importo_pratica_40 !== null
            ? String(body?.importo_pratica_40)
            : body?.pratica_40 !== undefined && body?.pratica_40 !== null
              ? String(body?.pratica_40)
              : null,
        importo_finanziato: importoFinanziato,
        importo_totale_mezzo: importoFinanziato,
        note: body?.note || null
      }
    });

    return {
      id: updated.id,
      numero_interno: updated.numero_interno,
      mezzo: updated.mezzo,
      importo_finanziato: updated.importo_finanziato,
      importo_totale_mezzo: updated.importo_totale_mezzo,
      importo_contratto: updated.importo_totale_mezzo
    };
  });

  app.delete("/mezzi/:id", { preHandler: [requireAuth, requireAzienda] }, async (request, reply) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const mezzoId = Number((request.params as any)?.id || 0);
    if (!mezzoId) return reply.code(400).send({ error: "Mezzo non valido" });

    const existing = await prisma.leasing_contracts.findFirst({
      where: { id: mezzoId, azienda_id: aziendaId }
    });
    if (!existing) return reply.code(404).send({ error: "Mezzo non trovato" });

    await prisma.leasing_contracts.delete({ where: { id: mezzoId } });
    return { ok: true };
  });

  app.get("/mezzi", { preHandler: [requireAuth, requireAzienda] }, async (request) => {
    const aziendaId = (request as RequestWithAzienda).aziendaId as number;
    const query = request.query as {
      page?: string;
      pageSize?: string;
      q?: string;
      praticaId?: string;
    };
    const page = Math.max(Number(query?.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(query?.pageSize || 20), 5), 200);
    const q = (query?.q || "").trim();
    const praticaId = Number(query?.praticaId || 0);

    const where: any = { azienda_id: aziendaId };
    if (q) {
      where.OR = [
        { numero_interno: { contains: q } },
        { mezzo: { contains: q } },
        { fornitore: { contains: q } },
        { descrizione_bene: { contains: q } }
      ];
    }
    if (praticaId) {
      where.pratica_id = praticaId;
    }

    const [totalCount, items] = await Promise.all([
      prisma.leasing_contracts.count({ where }),
      prisma.leasing_contracts.findMany({
        where,
        orderBy: { id: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      items: items.map((m: any) => ({
        id: m.id,
        pratica_id: m.pratica_id,
        numero_interno: m.numero_interno,
        mezzo: m.mezzo,
        fornitore: m.fornitore,
        descrizione_bene: m.descrizione_bene,
        importo_finanziato: m.importo_finanziato
      })),
      total: totalCount,
      page,
      pageSize
    };
  });

  app.get(
    "/admin/ping",
    { preHandler: [requireAuth, requireAzienda, requireRole(["admin"])] },
    async () => ({ ok: true })
  );

  const port = Number(process.env.APP_PORT || 3001);
  const host = "0.0.0.0";

  app.listen({ port, host }).then(() => {
    app.log.info(`Server listening on http://${host}:${port}`);
  }).catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
}

start().catch((err) => {
  app.log.error(err);
  process.exit(1);
});
