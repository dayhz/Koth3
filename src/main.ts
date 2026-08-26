import { ThreeRenderer } from './renderer/ThreeRenderer';
import { TEST_SCENARIOS, TestScenario } from './test-lab/TestLabScenarios';
import { RoadWorldEngine } from './engine/RoadWorldEngine';
import { WorldValidator } from './validation/WorldValidator';
import { WorldSerializer } from './serialization/WorldSerializer';

class App {
  private renderer!: ThreeRenderer;
  private currentEngine!: RoadWorldEngine;
  private lastTime: number = performance.now();
  public isSimulationPaused: boolean = false;

  constructor() {
    this.init();
  }

  private init(): void {
    const container = document.getElementById('viewport-container');
    if (!container) return;

    this.renderer = new ThreeRenderer(container);

    this.setupScenarioList();
    this.setupDebugToggles();
    this.setupCameraControls();
    this.setupJsonModal();

    // Charger le scénario par défaut (TEST-01)
    this.loadScenario(0);

    // Boucle d'animation temps réel des feux tricolores et de la simulation
    this.animateLoop();
  }

  private animateLoop = (): void => {
    requestAnimationFrame(this.animateLoop);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (!this.isSimulationPaused && this.currentEngine) {
      this.currentEngine.update(dt);
      this.renderer.updateTrafficLights(this.currentEngine.trafficLights);
    }
  };

  private setupScenarioList(): void {
    const listEl = document.getElementById('scenario-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    TEST_SCENARIOS.forEach((scenario, idx) => {
      const item = document.createElement('div');
      item.className = `scenario-item ${idx === 0 ? 'active' : ''}`;
      item.dataset.index = idx.toString();

      item.innerHTML = `
        <div class="scenario-header">
          <span class="scenario-id">${scenario.id}</span>
          <span class="scenario-name">${scenario.name}</span>
        </div>
        <div class="scenario-desc">${scenario.description}</div>
      `;

      item.addEventListener('click', () => {
        this.loadScenario(idx);
      });

      listEl.appendChild(item);
    });
  }

  private loadScenario(index: number): void {
    const scenario: TestScenario = TEST_SCENARIOS[index];

    // Mettre à jour la sélection active dans l'UI
    const items = document.querySelectorAll('.scenario-item');
    items.forEach((it, idx) => {
      if (idx === index) it.classList.add('active');
      else it.classList.remove('active');
    });

    // Instancier le moteur et construire la scène
    this.currentEngine = scenario.createEngine();
    this.renderer.renderWorld(
      this.currentEngine.network,
      this.currentEngine.regulation,
      this.currentEngine.trafficLights
    );
    this.renderer.resetCamera();

    this.updateStats();
    this.updateValidationReport();
  }

  private updateStats(): void {
    const stats = this.currentEngine.getStats();
    document.getElementById('stat-nodes')!.textContent = stats.nodesCount.toString();
    document.getElementById('stat-roads')!.textContent = stats.roadsCount.toString();
    document.getElementById('stat-lanes')!.textContent = stats.lanesCount.toString();
    document.getElementById('stat-sidewalks')!.textContent = stats.sidewalksCount.toString();
    document.getElementById('stat-crosswalks')!.textContent = stats.crosswalksCount.toString();
    document.getElementById('stat-stoplines')!.textContent = stats.stopLinesCount.toString();
  }

  private updateValidationReport(): void {
    const reportContainer = document.getElementById('validation-report-container');
    if (!reportContainer) return;

    const report = WorldValidator.validate(this.currentEngine.network);

    const card = document.createElement('div');
    card.className = `report-card ${report.isValid ? 'valid' : 'invalid'}`;

    let html = `
      <div class="report-status">
        ${report.isValid ? '✓ MONDE VALIDE' : '✗ MONDE INVALIDE'}
      </div>
      <div class="report-list">
    `;

    if (report.isValid) {
      for (const check of report.checksPassed) {
        html += `<div class="report-item">✓ ${check}</div>`;
      }
    } else {
      for (const err of report.errors) {
        html += `<div class="report-item" style="color: var(--accent-red)">✗ [${err.code}] ${err.message}</div>`;
      }
    }

    html += `</div>`;
    card.innerHTML = html;

    reportContainer.innerHTML = '';
    reportContainer.appendChild(card);
  }

  private setupDebugToggles(): void {
    const btnCenterlines = document.getElementById('toggle-centerlines');
    const btnLanes = document.getElementById('toggle-lanes');
    const btnNodes = document.getElementById('toggle-nodes');
    const btnIntersections = document.getElementById('toggle-intersections');

    const toggle = (btn: HTMLElement | null, getVal: () => boolean, setVal: (v: boolean) => void) => {
      if (!btn) return;
      btn.addEventListener('click', () => {
        const next = !getVal();
        setVal(next);
        if (next) btn.classList.add('active');
        else btn.classList.remove('active');
        this.renderer.debugRenderer.update(this.currentEngine.network, this.currentEngine.regulation);
      });
    };

    toggle(
      btnCenterlines,
      () => this.renderer.debugRenderer.showCenterlines,
      (v) => (this.renderer.debugRenderer.showCenterlines = v)
    );
    toggle(
      btnLanes,
      () => this.renderer.debugRenderer.showLanes,
      (v) => (this.renderer.debugRenderer.showLanes = v)
    );
    toggle(
      btnNodes,
      () => this.renderer.debugRenderer.showNodes,
      (v) => (this.renderer.debugRenderer.showNodes = v)
    );
    toggle(
      btnIntersections,
      () => this.renderer.debugRenderer.showIntersections,
      (v) => (this.renderer.debugRenderer.showIntersections = v)
    );
  }

  private setupCameraControls(): void {
    document.getElementById('btn-view-top')?.addEventListener('click', () => {
      this.renderer.setTopDownView();
    });

    document.getElementById('btn-view-orbit')?.addEventListener('click', () => {
      this.renderer.resetCamera();
    });
  }

  private setupJsonModal(): void {
    const modal = document.getElementById('json-modal')!;
    const textarea = document.getElementById('json-text') as HTMLTextAreaElement;
    const title = document.getElementById('modal-title')!;
    const actionBtn = document.getElementById('modal-action-btn')!;
    const closeBtn = document.getElementById('modal-close')!;

    let isImportMode = false;

    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    document.getElementById('btn-export-json')?.addEventListener('click', () => {
      isImportMode = false;
      title.textContent = 'Exporter le Monde (JSON)';
      actionBtn.textContent = 'Copier dans le Presse-papier';
      textarea.value = WorldSerializer.serialize(this.currentEngine);
      textarea.readOnly = false;
      modal.style.display = 'flex';
    });

    document.getElementById('btn-import-json')?.addEventListener('click', () => {
      isImportMode = true;
      title.textContent = 'Importer un Monde (JSON)';
      actionBtn.textContent = 'Charger et Rendre';
      textarea.value = '';
      textarea.readOnly = false;
      textarea.placeholder = 'Collez ici le JSON du monde...';
      modal.style.display = 'flex';
    });

    actionBtn.addEventListener('click', () => {
      if (isImportMode) {
        try {
          const jsonStr = textarea.value.trim();
          if (!jsonStr) return;
          this.currentEngine = WorldSerializer.deserialize(jsonStr);
          this.renderer.renderWorld(
            this.currentEngine.network,
            this.currentEngine.regulation,
            this.currentEngine.trafficLights
          );
          this.updateStats();
          this.updateValidationReport();
          modal.style.display = 'none';
        } catch (e: any) {
          alert(`Erreur d'importation JSON : ${e.message}`);
        }
      } else {
        navigator.clipboard.writeText(textarea.value);
        actionBtn.textContent = 'Copié ! ✓';
        setTimeout(() => {
          actionBtn.textContent = 'Copier dans le Presse-papier';
        }, 2000);
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
