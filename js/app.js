import { escapeHtml } from './cardsData.js';
/**
 * AETHERIUM TCG DECKBUILDER - APPLICATION BOOTSTRAP
 */

import { state, loadInitialState, subscribeToDeck, subscribeToFilters, clearDeck, exportDeckToText, exportDeckToJSON, importDeckFromText, importDeckFromJSON } from './state.js';
import { initCardInspector } from './cardInspector.js';
import { initDeckView, renderDeck } from './deckManager.js';
import { initFilters, renderLibrary } from './filterManager.js';
import { initDragAndDrop } from './dragAndDrop.js';
import { initTestHandModal } from './testHand.js';
import { initSoundState, toggleSound, isSoundEnabled, playClick, playCardDrop, playCardRemove } from './sound.js';
import { initIndexedDB, processImageFiles, clearCustomCardsDB } from './customCardImporter.js';

// ==================== TOAST NOTIFICATIONS ====================
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✨',
    warning: '⚠️',
    danger: '🛑',
    info: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '✨'}</span>
    <span class="toast-text">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// ==================== SOUND TOGGLE ====================
function initSoundButton() {
  const btn = document.getElementById('btn-sound-toggle');
  const icon = document.getElementById('sound-icon');
  
  const updateIcon = () => {
    if (icon) {
      icon.textContent = isSoundEnabled() ? '🔊' : '🔇';
    }
  };

  initSoundState();
  updateIcon();

  if (btn) {
    btn.addEventListener('click', () => {
      const enabled = toggleSound();
      updateIcon();
      showToast(enabled ? 'Efectos de sonido activados' : 'Efectos de sonido silenciados', 'info');
    });
  }
}

// ==================== CLEAR DECK MODAL / CONFIRM ====================
function initClearDeckButton() {
  const btn = document.getElementById('btn-clear-deck');
  if (btn) {
    btn.addEventListener('click', () => {
      if (state.deck.length === 0) {
        showToast('El mazo ya está vacío.', 'info');
        return;
      }
      if (confirm('¿Estás seguro de que deseas vaciar todas las cartas del mazo?')) {
        clearDeck();
        playCardRemove();
        showToast('Se ha vaciado el mazo por completo.', 'info');
      }
    });
  }
}

// ==================== EXPORT / IMPORT MODAL ====================
function initExportImportModal() {
  const modal = document.getElementById('modal-export-import');
  const openBtn = document.getElementById('btn-export-deck');
  const closeBtn = document.getElementById('btn-close-export');
  const copyBtn = document.getElementById('btn-copy-clipboard');
  const applyBtn = document.getElementById('btn-import-apply');

  const textArea = document.getElementById('export-text-area');
  const jsonArea = document.getElementById('export-json-area');

  const tabButtons = modal ? modal.querySelectorAll('.tab-btn') : [];

  let currentTab = 'tab-text-deck';

  // Tab Switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;

      const tabText = document.getElementById('tab-text-deck');
      const tabJson = document.getElementById('tab-json-deck');

      if (currentTab === 'tab-text-deck') {
        if (tabText) tabText.classList.add('active');
        if (tabJson) tabJson.classList.remove('active');
      } else {
        if (tabText) tabText.classList.remove('active');
        if (tabJson) tabJson.classList.add('active');
      }
      playClick();
    });
  });

  // Open Modal & Populate current deck representations
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      playClick();
      if (textArea) textArea.value = exportDeckToText();
      if (jsonArea) jsonArea.value = exportDeckToJSON();
      if (modal) modal.classList.add('is-open');
    });
  }

  // Close Modal
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('is-open'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('is-open');
    });
  }

  // Copy to Clipboard
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      playClick();
      const contentToCopy = currentTab === 'tab-text-deck' 
        ? (textArea ? textArea.value : '') 
        : (jsonArea ? jsonArea.value : '');

      try {
        await navigator.clipboard.writeText(contentToCopy);
        showToast('¡Copiado al portapapeles con éxito!', 'success');
      } catch {
        showToast('No se pudo copiar automáticamente. Por favor selecciona y copia manualmente.', 'warning');
      }
    });
  }

  // Import / Load Deck from Text/JSON
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      playClick();
      let res;
      if (currentTab === 'tab-text-deck') {
        const text = textArea ? textArea.value : '';
        res = importDeckFromText(text);
      } else {
        const json = jsonArea ? jsonArea.value : '';
        res = importDeckFromJSON(json);
      }

      if (res.success) {
        document.getElementById('deck-name-input').value = state.deckName;
        showToast(`¡Mazo cargado exitosamente (${res.count} cartas)!`, 'success');
        if (modal) modal.classList.remove('is-open');
      } else {
        showToast(res.reason || 'Error al importar el mazo.', 'danger');
      }
    });
  }
}

// ==================== CUSTOM CARD / FOLDER IMPORTER MODAL ====================
function initCardImportModal() {
  const modal = document.getElementById('modal-import-images');
  const openBtn = document.getElementById('btn-import-folder');
  const closeBtn = document.getElementById('btn-close-import-images');
  const confirmCloseBtn = document.getElementById('btn-confirm-import-close');

  const folderInput = document.getElementById('input-import-folder');
  const filesInput = document.getElementById('input-import-files');
  const selectFolderBtn = document.getElementById('btn-select-folder');
  const selectFilesBtn = document.getElementById('btn-select-files');
  const dropArea = document.getElementById('import-drop-area');

  const progressBox = document.getElementById('import-progress-box');
  const progressFill = document.getElementById('import-progress-fill');
  const progressText = document.getElementById('import-progress-text');
  const resultsSummary = document.getElementById('import-results-summary');
  const cardsPreview = document.getElementById('import-cards-preview');
  const clearCustomBtn = document.getElementById('btn-clear-custom-cards');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      playClick();
      if (modal) modal.classList.add('is-open');
    });
  }

  const closeModal = () => {
    if (modal) modal.classList.remove('is-open');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (confirmCloseBtn) confirmCloseBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Trigger File Dialogs
  if (selectFolderBtn && folderInput) {
    selectFolderBtn.addEventListener('click', () => folderInput.click());
  }

  if (selectFilesBtn && filesInput) {
    selectFilesBtn.addEventListener('click', () => filesInput.click());
  }

  let importing = false;
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    if (importing) return;
    importing = true;
    try {

    if (progressBox) progressBox.style.display = 'flex';
    if (resultsSummary) resultsSummary.style.display = 'none';
    if (cardsPreview) cardsPreview.innerHTML = '';

    const imported = await processImageFiles(files, (current, total, card) => {
      const pct = Math.round((current / total) * 100);
      if (progressFill) progressFill.style.width = `${pct}%`;
      if (progressText) progressText.textContent = `Procesando: ${current}/${total} (${escapeHtml(card.name)})`;
    });

    if (progressBox) progressBox.style.display = 'none';

    if (imported.length > 0) {
      playCardDrop();
      showToast(`¡Se importaron ${imported.length} cartas al catálogo!`, 'success');

      if (resultsSummary && cardsPreview) {
        resultsSummary.style.display = 'block';
        cardsPreview.innerHTML = '';
        imported.forEach(c => {
          const chip = document.createElement('div');
          chip.className = 'preview-chip';
          chip.innerHTML = `
            <span class="preview-chip-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
            <span class="preview-chip-meta">${escapeHtml(c.type)} • ${c.cost}💧</span>
          `;
          cardsPreview.appendChild(chip);
        });
      }

      renderLibrary();
    } else {
      showToast('No hay imágenes nuevas: la selección está vacía, no contiene imágenes o ya fue importada.', 'warning');
    }
    } catch (error) {
      showToast(error.message || 'No se pudo completar la importación.', 'danger');
    } finally {
      importing = false;
      if (progressBox) progressBox.style.display = 'none';
      document.getElementById('input-import-folder').value = '';
      document.getElementById('input-import-files').value = '';
      renderLibrary();
    }

  };

  if (folderInput) {
    folderInput.addEventListener('change', (e) => handleFiles(e.target.files));
  }

  if (filesInput) {
    filesInput.addEventListener('change', (e) => handleFiles(e.target.files));
  }

  // Drag & Drop on Modal Drop Area
  if (dropArea) {
    dropArea.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dropArea.classList.add('is-drag-over');
    });

    dropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    dropArea.addEventListener('dragleave', (e) => {
      if (!dropArea.contains(e.relatedTarget)) {
        dropArea.classList.remove('is-drag-over');
      }
    });

    dropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dropArea.classList.remove('is-drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    });
  }

  // Clear Custom Cards Button
  if (clearCustomBtn) {
    clearCustomBtn.addEventListener('click', async () => {
      if (confirm('¿Deseas eliminar todas las cartas personalizadas importadas?')) {
        await clearCustomCardsDB();
        showToast('Cartas personalizadas eliminadas. Recargando catálogo...', 'info');
        setTimeout(() => location.reload(), 600);
      }
    });
  }
}

// ==================== APP INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
  initCardInspector();
  // 1. Initialize IndexedDB for custom card persistence
  await initIndexedDB();

  // 2. Load Stored Data
  loadInitialState();

  // 3. Initialize Views and Controllers
  initSoundButton();
  initDeckView();
  initFilters();
  initDragAndDrop();
  initTestHandModal();
  initExportImportModal();
  initCardImportModal();
  initClearDeckButton();

  // 4. Subscribe to reactive state
  subscribeToDeck(() => {
    renderDeck();
    renderLibrary(); // update in-deck counters on library cards
  });

  subscribeToFilters(() => {
    renderLibrary();
  });

  // 5. Initial Render
  renderDeck();
  renderLibrary();
});
