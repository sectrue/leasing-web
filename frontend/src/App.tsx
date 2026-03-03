import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { useMezzi } from "./hooks/useMezzi";
import { usePratiche } from "./hooks/usePratiche";
import { usePraticaForm } from "./hooks/usePraticaForm";
import { useLeasingCompanies } from "./hooks/useLeasingCompanies";
import { useAziende } from "./hooks/useAziende";
import { useStats } from "./hooks/useStats";
import { DashboardPage } from "./pages/DashboardPage";
import { PratichePage } from "./pages/PratichePage";
import { MezziPage } from "./pages/MezziPage";
import { StatistichePage } from "./pages/StatistichePage";
import { AziendePage } from "./pages/AziendePage";
import { SocietaLeasingPage } from "./pages/SocietaLeasingPage";
import { LoginCard } from "./components/LoginCard";
import { MezziModal } from "./components/MezziModal";
import { MezzoFormModal } from "./components/MezzoFormModal";
import { PraticaFormModal } from "./components/PraticaFormModal";
import { formatCurrency, parseMoney } from "./lib/format";

export default function App() {
  const [activePage, setActivePage] = useState<
    "dashboard" | "pratiche" | "mezzi" | "statistiche" | "aziende" | "societa-leasing"
  >("dashboard");

  const auth = useAuth();
  const aziende = useAziende({ token: auth.token });
  const pratiche = usePratiche({
    token: auth.token,
    active: activePage === "pratiche",
    aziendaId: aziende.aziendaId
  });
  const stats = useStats({
    token: auth.token,
    active: activePage === "statistiche",
    aziendaId: aziende.aziendaId
  });
  const leasingCompanies = useLeasingCompanies({
    token: auth.token,
    active: activePage === "societa-leasing",
    aziendaId: aziende.aziendaId
  });
  const mezzi = useMezzi({
    token: auth.token,
    onPraticheChanged: pratiche.loadPratiche,
    active: activePage === "mezzi",
    aziendaId: aziende.aziendaId
  });
  const praticaForm = usePraticaForm({
    token: auth.token,
    aziendaId: aziende.aziendaId,
    onSaved: () => {
      pratiche.loadPratiche();
    }
  });

  function statusBadgeClass(status: string) {
    if (status === "Attiva") return "badge badge-green";
    if (status === "In lavorazione") return "badge badge-orange";
    return "badge badge-gray";
  }

  function calcImportoFinanziato() {
    const importo = parseMoney(mezzi.mezzoForm.importo_mezzo);
    const pratica40 = parseMoney(mezzi.mezzoForm.importo_pratica_40);
    const allestimento = parseMoney(mezzi.mezzoForm.importo_allestimento_materiale);
    return importo + pratica40 + allestimento;
  }

  const pageTitleMap: Record<typeof activePage, string> = {
    dashboard: "Dashboard",
    pratiche: "Pratiche",
    mezzi: "Mezzi",
    statistiche: "Statistiche",
    aziende: "Aziende",
    "societa-leasing": "Societa Leasing"
  };
  const aziendaSelezionata = aziende.items.find((a) => a.id === aziende.aziendaId) || null;

  if (!auth.token || !auth.user) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] text-[#1f2937]">
        <header className="header-bar">
          <div className="container-1200 flex items-center justify-between px-6 py-4">
            <div>
              <p className="header-meta">Leasing Manager</p>
              <h1 className="page-title">Accesso</h1>
            </div>
            <div className="text-sm text-[#6b7280]">Console operativa</div>
          </div>
        </header>

        <div
          className="container-1200 flex min-h-[calc(100vh-88px)] items-start px-6"
          style={{ paddingTop: 56 }}
        >
          <LoginCard
            username={auth.username}
            password={auth.password}
            error={auth.error}
            loading={auth.loading}
            onUsernameChange={auth.setUsername}
            onPasswordChange={auth.setPassword}
            onLogin={auth.login}
          />
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(pratiche.totalRows / pratiche.pageSize));

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#1f2937]">
      <header className="header-bar">
        <div className="container-1200 px-6 py-5">
          <div className="app-header-top">
            <div className="app-header-left">
              <div>
                <p className="header-meta">Leasing Manager</p>
                <h1 className="page-title">Console operativa</h1>
              </div>

              <nav className="app-nav">
                <div className="app-nav-group">
                  <button
                    className={`nav-link ${activePage === "dashboard" ? "nav-active" : ""}`}
                    onClick={() => setActivePage("dashboard")}
                  >
                    Dashboard
                  </button>
                  <button
                    className={`nav-link ${activePage === "pratiche" ? "nav-active" : ""}`}
                    onClick={() => setActivePage("pratiche")}
                  >
                    Pratiche
                  </button>
                  <button
                    className={`nav-link ${activePage === "mezzi" ? "nav-active" : ""}`}
                    onClick={() => setActivePage("mezzi")}
                  >
                    Mezzi
                  </button>
                </div>

                <div className="app-nav-group app-nav-secondary">
                  <button
                    className={`nav-link ${activePage === "statistiche" ? "nav-active" : ""}`}
                    onClick={() => setActivePage("statistiche")}
                  >
                    Statistiche
                  </button>
                  <button
                    className={`nav-link ${activePage === "aziende" ? "nav-active" : ""}`}
                    onClick={() => setActivePage("aziende")}
                  >
                    Aziende
                  </button>
                  <button
                    className={`nav-link ${activePage === "societa-leasing" ? "nav-active" : ""}`}
                    onClick={() => setActivePage("societa-leasing")}
                  >
                    Societa Leasing
                  </button>
                </div>
              </nav>
            </div>

            <div className="app-header-user">
              <span className="user-pill">
                {auth.user.username} · {auth.user.role}
              </span>
              <button className="btn btn-outline btn-sm" onClick={auth.logout}>Esci</button>
            </div>
          </div>
          <div className="app-header-divider" />
        </div>
      </header>

      <main className="container-1200 px-6 py-8">
        <section className="page-context-strip">
          <div className="page-context-title">
            <p className="header-meta">Pagina</p>
            <h2 className="section-title">{pageTitleMap[activePage]}</h2>
          </div>
          <div className="page-context-controls">
            <div className="azienda-control">
              <span className="azienda-control-label">Azienda</span>
              <div className="azienda-control-select">
                <select
                  className="select text-sm"
                  value={aziende.aziendaId ?? ""}
                  onChange={(e) => aziende.setAziendaId(Number(e.target.value))}
                  disabled={aziende.loading || aziende.items.length === 0}
                >
                  {aziende.items.length === 0 && <option value="">Nessuna</option>}
                  {aziende.items.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {aziendaSelezionata && (
              <span className="header-kpi-pill">
                Rimanente: {formatCurrency(aziendaSelezionata.plafond_rimanente || 0)}
              </span>
            )}
          </div>
        </section>

        {activePage === "dashboard" && (
          <DashboardPage kpi={stats.kpi} kpiError={stats.kpiError} />
        )}

        {activePage === "pratiche" && (
          <PratichePage
            searchTerm={pratiche.searchTerm}
            quickFilter={pratiche.quickFilter}
            praticaFilter={pratiche.praticaFilter}
            leasingFilter={pratiche.leasingFilter}
            brokerFilter={pratiche.brokerFilter}
            praticaOptions={pratiche.praticaOptions}
            leasingOptions={pratiche.leasingOptions}
            brokerOptions={pratiche.brokerOptions}
            setSearchTerm={pratiche.setSearchTerm}
            setQuickFilter={pratiche.setQuickFilter}
            setPraticaFilter={pratiche.setPraticaFilter}
            setLeasingFilter={pratiche.setLeasingFilter}
            setBrokerFilter={pratiche.setBrokerFilter}
            pratiche={pratiche.pratiche}
            praticheLoading={pratiche.praticheLoading}
            praticheError={pratiche.praticheError}
            page={pratiche.page}
            totalPages={totalPages}
            pageSize={pratiche.pageSize}
            totalRows={pratiche.totalRows}
            onPrev={() => pratiche.setPage(Math.max(1, pratiche.page - 1))}
            onNext={() => pratiche.setPage(Math.min(totalPages, pratiche.page + 1))}
            onPageSize={(v) => {
              pratiche.setPageSize(v);
              pratiche.setPage(1);
            }}
            onNewPratica={praticaForm.openNewPratica}
            onEditPratica={praticaForm.openEditPratica}
            onDeletePratica={pratiche.deletePratica}
            onMezzi={mezzi.loadMezzi}
            onPrintAll={pratiche.printPraticheAll}
            onPrintPratica={pratiche.printPratica}
            printing={pratiche.pratichePrintLoading}
            statusBadgeClass={statusBadgeClass}
          />
        )}

        {activePage === "mezzi" && (
          <MezziPage
            mezziSearch={mezzi.mezziSearch}
            mezziPraticaFilter={mezzi.mezziPraticaFilter}
            praticaOptions={pratiche.praticaOptions}
            setMezziSearch={mezzi.setMezziSearch}
            setMezziPraticaFilter={mezzi.setMezziPraticaFilter}
            mezziList={mezzi.mezziList}
            mezziListLoading={mezzi.mezziListLoading}
            mezziListError={mezzi.mezziListError}
            page={mezzi.mezziPage}
            totalPages={mezzi.mezziTotalPages}
            pageSize={mezzi.mezziPageSize}
            onPrev={() => mezzi.setMezziPage(Math.max(1, mezzi.mezziPage - 1))}
            onNext={() => mezzi.setMezziPage(Math.min(mezzi.mezziTotalPages, mezzi.mezziPage + 1))}
            onPageSize={(v) => {
              mezzi.setMezziPageSize(v);
              mezzi.setMezziPage(1);
            }}
            onNewMezzo={() => mezzi.openMezzoFormWithPratica(
              mezzi.mezziPraticaFilter ? Number(mezzi.mezziPraticaFilter) : null
            )}
            onEditMezzo={mezzi.openEditMezzo}
            onDeleteMezzo={mezzi.deleteMezzo}
          />
        )}

        {activePage === "statistiche" && (
          <StatistichePage
            kpi={stats.kpi}
            kpiError={stats.kpiError}
            monthly={stats.monthly}
            monthlyError={stats.monthlyError}
          />
        )}

        {activePage === "aziende" && (
          <AziendePage
            items={aziende.items}
            loading={aziende.loading}
            error={aziende.error}
            editingId={aziende.editingId}
            editNome={aziende.editNome}
            editPlafond={aziende.editPlafond}
            editUtilizzatoPregresso={aziende.editUtilizzatoPregresso}
            newNome={aziende.newNome}
            newPlafond={aziende.newPlafond}
            newUtilizzatoPregresso={aziende.newUtilizzatoPregresso}
            createError={aziende.createError}
            saveError={aziende.saveError}
            deleteError={aziende.deleteError}
            creating={aziende.creating}
            saving={aziende.saving}
            deletingId={aziende.deletingId}
            onEditNomeChange={aziende.setEditNome}
            onEditPlafondChange={aziende.setEditPlafond}
            onEditUtilizzatoPregressoChange={aziende.setEditUtilizzatoPregresso}
            onNewNomeChange={aziende.setNewNome}
            onNewPlafondChange={aziende.setNewPlafond}
            onNewUtilizzatoPregressoChange={aziende.setNewUtilizzatoPregresso}
            onEdit={aziende.startEdit}
            onCreate={aziende.createItem}
            onDelete={aziende.deleteItem}
            onCancel={aziende.cancelEdit}
            onSave={aziende.saveEdit}
          />
        )}

        {activePage === "societa-leasing" && (
          <SocietaLeasingPage
            items={leasingCompanies.items}
            loading={leasingCompanies.loading}
            error={leasingCompanies.error}
            editingId={leasingCompanies.editingId}
            form={leasingCompanies.form}
            setForm={leasingCompanies.setForm}
            onNew={leasingCompanies.newItem}
            onSave={async () => {
              await leasingCompanies.save();
              await pratiche.loadPratiche();
            }}
            onEdit={leasingCompanies.editItem}
            onDelete={async (id) => {
              await leasingCompanies.remove(id);
              await pratiche.loadPratiche();
            }}
          />
        )}
      </main>

      <MezziModal
        open={mezzi.mezziOpen}
        label={mezzi.mezziPraticaLabel}
        loading={mezzi.mezziLoading}
        error={mezzi.mezziError}
        mezzi={mezzi.mezzi}
        onClose={() => mezzi.setMezziOpen(false)}
        onNew={mezzi.openMezzoForm}
        onEdit={mezzi.openEditMezzo}
        onDelete={mezzi.deleteMezzo}
        formatCurrency={formatCurrency}
      />

      <MezzoFormModal
        open={mezzi.mezzoFormOpen}
        mode={mezzi.mezzoFormMode}
        error={mezzi.mezzoFormError}
        form={mezzi.mezzoForm}
        praticaId={mezzi.mezziPraticaId}
        praticaOptions={pratiche.praticaOptions}
        onPraticaChange={mezzi.setMezziPraticaId}
        onClose={mezzi.closeMezzoForm}
        onChange={mezzi.setMezzoForm}
        onSave={mezzi.saveMezzo}
        formatCurrency={formatCurrency}
        calcImportoFinanziato={calcImportoFinanziato}
      />

      <PraticaFormModal
        open={praticaForm.praticaFormOpen}
        mode={praticaForm.praticaFormMode}
        form={praticaForm.praticaForm}
        error={praticaForm.praticaFormError}
        leasingCompanies={leasingCompanies.items}
        attachments={praticaForm.praticaAttachments}
        attachmentPreviews={praticaForm.attachmentPreviews}
        attachmentsError={praticaForm.praticaAttachmentsError}
        sabatiniErogazioni={praticaForm.sabatiniErogazioni}
        sabatiniEventi={praticaForm.sabatiniEventi}
        sabatiniError={praticaForm.sabatiniError}
        erogazioneForm={praticaForm.erogazioneForm}
        eventoForm={praticaForm.eventoForm}
        dragOver={praticaForm.dragOver}
        setDragOver={praticaForm.setDragOver}
        onClose={praticaForm.closePraticaForm}
        onSave={praticaForm.savePratica}
        onFormChange={praticaForm.setPraticaForm}
        onUpload={praticaForm.uploadPraticaAttachment}
        onDeleteAttachment={praticaForm.deletePraticaAttachment}
        onOpenAttachment={praticaForm.openPraticaAttachment}
        onErogazioneFormChange={praticaForm.setErogazioneForm}
        onAddErogazione={praticaForm.addSabatiniErogazione}
        onDeleteErogazione={praticaForm.deleteSabatiniErogazione}
        onEventoFormChange={praticaForm.setEventoForm}
        onAddEvento={praticaForm.addSabatiniEvento}
        onDeleteEvento={praticaForm.deleteSabatiniEvento}
      />
    </div>
  );
}
