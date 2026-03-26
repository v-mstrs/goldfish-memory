

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

/**
 * Displays AI scan extractions in a structured list.
 */
export function showScanResultsModal(extractions: any[], isPreview: boolean, novelSlug: string) {
    injectModalStyles();

    const existing = document.getElementById('goldfish-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'goldfish-modal-overlay';
    overlay.className = 'goldfish-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'goldfish-modal';
    modal.style.width = '480px'; // Wider for list
    modal.style.maxHeight = '85vh';

    // Header
    const header = document.createElement('div');
    header.className = 'goldfish-modal-header';

    const eyebrow = document.createElement('div');
    eyebrow.className = 'goldfish-modal-eyebrow';
    eyebrow.textContent = isPreview ? 'AI Scan Preview' : 'AI Scan Results';

    const title = document.createElement('div');
    title.className = 'goldfish-modal-title';
    title.textContent = isPreview ? 'Found Characters' : 'Confirm Character Updates';

    const subtitle = document.createElement('div');
    subtitle.className = 'goldfish-modal-subtitle';
    subtitle.textContent = isPreview 
        ? 'These are the characters the AI identified in the current text.' 
        : 'The following updates will be applied to your novel database.';

    header.appendChild(eyebrow);
    header.appendChild(title);
    header.appendChild(subtitle);
    modal.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'goldfish-modal-body';
    body.style.overflowY = 'auto';
    body.style.paddingTop = '8px';

    if (extractions.length === 0) {
        const empty = document.createElement('div');
        empty.style.padding = '20px';
        empty.style.textAlign = 'center';
        empty.style.color = '#79859a';
        empty.textContent = 'No characters found.';
        body.appendChild(empty);
    } else {
        extractions.forEach((ext, idx) => {
            const item = document.createElement('div');
            item.style.padding = '12px 0';
            if (idx > 0) item.style.borderTop = '1px solid rgba(255, 255, 255, 0.05)';

            const nameRow = document.createElement('div');
            nameRow.style.display = 'flex';
            nameRow.style.alignItems = 'baseline';
            nameRow.style.gap = '8px';
            nameRow.style.marginBottom = '4px';

            const name = document.createElement('strong');
            name.style.color = '#fff';
            name.style.fontSize = '14px';
            name.textContent = ext.name;

            const type = document.createElement('span');
            type.style.fontSize = '10px';
            type.style.textTransform = 'uppercase';
            type.style.padding = '2px 6px';
            type.style.borderRadius = '4px';
            type.style.fontWeight = '700';
            
            if (ext.match_id) {
                type.textContent = 'Update';
                type.style.background = 'rgba(79, 121, 199, 0.2)';
                type.style.color = '#5b88d6';
            } else {
                type.textContent = 'New';
                type.style.background = 'rgba(82, 196, 26, 0.15)';
                type.style.color = '#52c41a';
            }

            nameRow.appendChild(name);
            nameRow.appendChild(type);

            const desc = document.createElement('div');
            desc.style.fontSize = '12px';
            desc.style.color = '#aab4c3';
            desc.style.lineHeight = '1.4';
            desc.textContent = ext.description;

            item.appendChild(nameRow);
            item.appendChild(desc);

            if (ext.aliases && ext.aliases.length > 0) {
                const aliases = document.createElement('div');
                aliases.style.fontSize = '11px';
                aliases.style.color = '#6f8795';
                aliases.style.marginTop = '4px';
                aliases.textContent = `Aliases: ${ext.aliases.join(', ')}`;
                item.appendChild(aliases);
            }

            body.appendChild(item);
        });
    }

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
    cancelBtn.textContent = isPreview ? 'Close' : 'Cancel';
    cancelBtn.onclick = close;
    footer.appendChild(cancelBtn);

    if (!isPreview && extractions.length > 0) {
        const commitBtn = document.createElement('button');
        commitBtn.className = 'goldfish-btn goldfish-btn-primary';
        commitBtn.textContent = 'Commit to DB';
        commitBtn.onclick = async () => {
            commitBtn.disabled = true;
            commitBtn.textContent = 'Syncing...';
            try {
                await browser.runtime.sendMessage({
                    type: 'COMMIT_AI_SCAN',
                    novelSlug,
                    extractions
                });
                close();
            } catch (e) {
                console.error(e);
                commitBtn.textContent = 'Failed';
                setTimeout(() => {
                    commitBtn.textContent = 'Commit to DB';
                    commitBtn.disabled = false;
                }, 2000);
            }
        };
        footer.appendChild(commitBtn);
    }

    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.classList.add('visible');
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)'; 
    });
}

/**
 * Shows a simple loading indicator in the corner.
 */
export function showLoadingModal(message: string) {
    injectModalStyles();
    
    const existing = document.getElementById('goldfish-loading-toast');
    if (existing) {
        const text = existing.querySelector('.goldfish-loading-text');
        if (text) text.textContent = message;
        return;
    }

    const toast = document.createElement('div');
    toast.id = 'goldfish-loading-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.background = '#161a21';
    toast.style.color = '#fff';
    toast.style.padding = '12px 16px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
    toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    toast.style.zIndex = '2147483646';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '12px';
    toast.style.fontFamily = 'sans-serif';
    toast.style.fontSize = '13px';
    toast.style.pointerEvents = 'none';
    toast.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';

    const spinner = document.createElement('div');
    spinner.style.width = '16px';
    spinner.style.height = '16px';
    spinner.style.border = '2px solid rgba(255, 255, 255, 0.1)';
    spinner.style.borderTopColor = '#634dbf';
    spinner.style.borderRadius = '50%';
    spinner.style.animation = 'goldfish-spin 1s linear infinite';

    const text = document.createElement('div');
    text.className = 'goldfish-loading-text';
    text.textContent = message;

    toast.appendChild(spinner);
    toast.appendChild(text);
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });
}

/**
 * Removes the loading indicator.
 */
export function hideLoadingModal() {
    const loader = document.getElementById('goldfish-loading-toast');
    if (loader) {
        loader.style.transform = 'translateY(20px)';
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 300);
    }
}
