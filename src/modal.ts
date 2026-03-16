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
            background: rgba(10, 12, 16, 0.42);
            backdrop-filter: blur(2px);
            z-index: 2147483647;
            opacity: 0;
            transition: opacity 0.22s ease-in-out;
            display: block; /* Allows absolute positioning of children */
        }
        .goldfish-modal-overlay.visible {
            opacity: 1;
        }
        .goldfish-modal {
            position: absolute;
            background: #161a21;
            color: #e7edf7;
            width: 360px;
            max-width: 90vw;
            border-radius: 10px;
            box-shadow: 0 14px 32px rgba(0, 0, 0, 0.35);
            border: 1px solid rgba(255, 255, 255, 0.08);
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: scale(0.96) translateY(6px);
            transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .goldfish-modal-overlay.visible .goldfish-modal {
            transform: scale(1) translateY(0);
        }
        .goldfish-modal-header {
            padding: 18px 18px 14px;
            background: #1b2029;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .goldfish-modal-eyebrow {
            margin-bottom: 8px;
            color: #90a0b8;
            font-size: 11px;
            letter-spacing: 0.08em;
            font-weight: 700;
            text-transform: uppercase;
        }
        .goldfish-modal-title {
            color: #fff;
            font-weight: 650;
            font-size: 17px;
            line-height: 1.2;
            margin: 0;
        }
        .goldfish-modal-subtitle {
            margin-top: 8px;
            color: #aab4c3;
            font-size: 12px;
            line-height: 1.45;
        }
        .goldfish-name-pill {
            margin-top: 12px;
            display: inline-flex;
            align-items: center;
            width: fit-content;
            max-width: 100%;
            padding: 5px 9px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #d6deea;
            font-size: 12px;
            font-weight: 600;
        }
        .goldfish-modal-body {
            padding: 16px 18px 18px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }
        .goldfish-input-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .goldfish-label {
            font-size: 12px;
            color: #a7b1c0;
            font-weight: 600;
            margin-left: 1px;
        }
        .goldfish-input {
            background: #20252f;
            border: 1px solid #323947;
            border-radius: 7px;
            padding: 10px 12px;
            color: #fff;
            font-size: 13px;
            font-family: inherit;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
            width: 100%;
            box-sizing: border-box;
        }
        .goldfish-input::placeholder {
            color: #79859a;
        }
        .goldfish-input:focus {
            background: #242a35;
            border-color: #5b88d6;
            box-shadow: 0 0 0 2px rgba(91, 136, 214, 0.18);
        }
        .goldfish-textarea {
            resize: vertical;
            min-height: 84px;
            line-height: 1.45;
        }
        .goldfish-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 92px;
            gap: 12px;
            align-items: end;
        }
        .goldfish-color-input {
            padding: 4px;
            height: 42px;
            cursor: pointer;
        }
        .goldfish-modal-footer {
            padding: 14px 18px 16px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            background: #141820;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .goldfish-btn {
            min-width: 92px;
            padding: 9px 16px;
            border-radius: 7px;
            border: 1px solid transparent;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
        }
        .goldfish-btn-secondary {
            background: #212733;
            color: #b8c4d8;
            border-color: #343d4d;
        }
        .goldfish-btn-secondary:hover {
            color: #fff;
            background: #283040;
        }
        .goldfish-btn-primary {
            background: #4f79c7;
            color: #fff;
            box-shadow: none;
        }
        .goldfish-btn-primary:hover {
            background: #5b88d6;
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
export function showAddCharacterModal(name: string, novelSlug: string, selectionRect?: DOMRect) {
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

    const eyebrow = document.createElement('div');
    eyebrow.className = 'goldfish-modal-eyebrow';
    eyebrow.textContent = 'Selection Capture';

    const title = document.createElement('div');
    title.className = 'goldfish-modal-title';
    title.textContent = 'Add character memory';

    const subtitle = document.createElement('div');
    subtitle.className = 'goldfish-modal-subtitle';
    subtitle.textContent = 'Save a quick reminder for this name so future chapters are easier to follow.';

    const pill = document.createElement('div');
    pill.className = 'goldfish-name-pill';
    pill.textContent = name;

    header.appendChild(eyebrow);
    header.appendChild(title);
    header.appendChild(subtitle);
    header.appendChild(pill);
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
    const colorField = createField('Highlight Color', '#c5daff', 'text', true);
    colorField.input.setAttribute('type', 'color');
    colorField.input.classList.add('goldfish-color-input');
    colorField.input.value = '#c5daff';

    body.appendChild(descField.group);
    body.appendChild(aliasField.group);

    const mediaRow = document.createElement('div');
    mediaRow.className = 'goldfish-row';
    mediaRow.appendChild(imgField.group);
    mediaRow.appendChild(colorField.group);

    body.appendChild(mediaRow);
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
        const highlightColor = colorField.input.value.trim();

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
                novelSlug,
                name,
                description,
                aliases,
                imageUrl,
                highlightColor
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
