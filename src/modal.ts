import { browser } from 'wxt/browser';

const MODAL_STYLE_ID = 'goldfish-modal-styles';

/**
 * Injects the CSS for the modal if it hasn't been injected yet.
 */
function injectModalStyles() {
    if (document.getElementById(MODAL_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = MODAL_STYLE_ID;
    style.textContent = `
        .goldfish-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(3px);
            z-index: 2147483647;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
            display: block; /* Allows absolute positioning of children */
        }
        .goldfish-modal-overlay.visible {
            opacity: 1;
        }
        .goldfish-modal {
            position: absolute;
            background: #1e1e1e;
            color: #e0e0e0;
            width: 340px;
            max-width: 90vw;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: scale(0.95);
            transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .goldfish-modal-overlay.visible .goldfish-modal {
            transform: scale(1);
        }
        .goldfish-modal-header {
            padding: 14px 16px;
            background: rgba(255, 255, 255, 0.03);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-weight: 600;
            font-size: 15px;
            color: #fff;
        }
        .goldfish-modal-body {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .goldfish-input-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .goldfish-label {
            font-size: 12px;
            color: #aaa;
            font-weight: 500;
            margin-left: 2px;
        }
        .goldfish-input {
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 6px;
            padding: 8px 10px;
            color: #fff;
            font-size: 13px;
            font-family: inherit;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
            width: 100%;
            box-sizing: border-box;
        }
        .goldfish-input:focus {
            border-color: #6495ED;
            box-shadow: 0 0 0 2px rgba(100, 149, 237, 0.2);
        }
        .goldfish-textarea {
            resize: vertical;
            min-height: 60px;
            line-height: 1.4;
        }
        .goldfish-modal-footer {
            padding: 12px 16px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            background: rgba(0, 0, 0, 0.2);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .goldfish-btn {
            padding: 6px 14px;
            border-radius: 6px;
            border: none;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        .goldfish-btn-secondary {
            background: transparent;
            color: #aaa;
        }
        .goldfish-btn-secondary:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.08);
        }
        .goldfish-btn-primary {
            background: #6495ED;
            color: #fff;
        }
        .goldfish-btn-primary:hover {
            background: #5b89db;
        }
        .goldfish-btn-primary:active {
            transform: translateY(1px);
        }
        .goldfish-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none !important;
        }
    `;
    (document.head || document.documentElement).appendChild(style);
}

/**
 * Displays a compact, dark-themed modal above the selected text to add a new character.
 */
export function showAddCharacterModal(name: string, novelId: number, selectionRect?: DOMRect) {
    injectModalStyles();

    const existing = document.getElementById('goldfish-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'goldfish-modal-overlay';
    overlay.className = 'goldfish-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'goldfish-modal';

    // Header
    const header = document.createElement('div');
    header.className = 'goldfish-modal-header';
    header.textContent = name;
    modal.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'goldfish-modal-body';

    // Helper: Create Input
    const createField = (label: string, placeholder: string, type: 'text' | 'textarea', optional = false) => {
        const group = document.createElement('div');
        group.className = 'goldfish-input-group';
        
        const labelEl = document.createElement('div');
        labelEl.className = 'goldfish-label';
        labelEl.textContent = label + (optional ? ' (Optional)' : '');
        group.appendChild(labelEl);

        const input = document.createElement(type === 'textarea' ? 'textarea' : 'input') as HTMLInputElement | HTMLTextAreaElement;
        input.className = `goldfish-input ${type === 'textarea' ? 'goldfish-textarea' : ''}`;
        input.placeholder = placeholder;
        group.appendChild(input);

        return { group, input };
    };

    const descField = createField('Description', 'Who is this character?', 'textarea');
    const aliasField = createField('Aliases', 'Nicknames, comma separated', 'text', true);
    const imgField = createField('Image URL', 'https://...', 'text', true);

    body.appendChild(descField.group);
    body.appendChild(aliasField.group);
    body.appendChild(imgField.group);
    modal.appendChild(body);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'goldfish-modal-footer';

    const close = () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 200);
    };

    overlay.onclick = (e) => {
        if (e.target === overlay) close();
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'goldfish-btn goldfish-btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = close;

    const saveBtn = document.createElement('button');
    saveBtn.className = 'goldfish-btn goldfish-btn-primary';
    saveBtn.textContent = 'Save';
    
    saveBtn.onclick = async () => {
        const description = descField.input.value.trim();
        const aliases = aliasField.input.value.split(',').map(s => s.trim()).filter(Boolean);
        const imageUrl = imgField.input.value.trim();

        if (!description && !imageUrl && !aliases.length) {
            descField.input.style.borderColor = '#ff4d4f';
            descField.input.focus();
            return;
        }

        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        try {
            await browser.runtime.sendMessage({
                type: 'ADD_CHARACTER',
                novelId,
                name,
                description,
                aliases,
                imageUrl
            });
            close();
        } catch (e) {
            console.error(e);
            saveBtn.textContent = 'Failed';
            saveBtn.style.backgroundColor = '#ff4d4f';
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.backgroundColor = '';
                saveBtn.disabled = false;
            }, 2000);
        }
    };

    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);
    modal.appendChild(footer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Positioning
    requestAnimationFrame(() => {
        overlay.classList.add('visible');
        descField.input.focus();

        const padding = 12;
        
        if (selectionRect && selectionRect.width > 0) {
            const modalRect = modal.getBoundingClientRect();
            const viewportW = document.documentElement.clientWidth;
            const viewportH = document.documentElement.clientHeight;

            let top = selectionRect.bottom + padding;
            let left = selectionRect.left;

            // Flip to top if not enough space below
            if (top + modalRect.height > viewportH - padding) {
                top = selectionRect.top - modalRect.height - padding;
            }

            // Constrain horizontal
            if (left + modalRect.width > viewportW - padding) {
                left = viewportW - modalRect.width - padding;
            }
            
            // Constrain vertical (if it flipped and went off top)
            if (top < padding) {
                top = padding;
            }
            if (left < padding) {
                left = padding;
            }

            modal.style.top = `${top}px`;
            modal.style.left = `${left}px`;
        } else {
            // Center
            modal.style.top = '50%';
            modal.style.left = '50%';
            modal.style.transform = 'translate(-50%, -50%)'; 
            
            modal.style.transition = 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
            
            // Initial state for centered (before visible class)
            modal.style.transform = 'translate(-50%, -50%) scale(0.95)';
            
            // Force reflow
            void modal.offsetWidth;
            
            // Final state
            requestAnimationFrame(() => {
                if (overlay.classList.contains('visible')) {
                    modal.style.transform = 'translate(-50%, -50%) scale(1)';
                }
            });
        }
    });
}