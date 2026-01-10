import browser from "webextension-polyfill";

export function showAddCharacterModal(name: string, novelId: number, selectionRect?: DOMRect) {
    // Remove existing modal if any
    const existing = document.getElementById('goldfish-modal-overlay');
    if (existing) existing.remove();

    // Create container for the modal (we don't use a full screen overlay anymore to allow clicking away? 
    // Actually, clicking away should close it. So maybe a transparent overlay is still good, but invisible).
    const overlay = document.createElement('div');
    overlay.id = 'goldfish-modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: transparent;
        z-index: 2147483647;
    `;

    // Close on click outside
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };

    // Create Modal
    const modal = document.createElement('div');
    // Dark theme matching popup
    const bgColor = '#242424';
    const inputBg = '#2d2d2d';
    const borderColor = '#3f3f3f';
    const textColor = '#ffffff';
    const accentColor = '#007acc';

    modal.style.cssText = `
        position: absolute;
        background: ${bgColor};
        color: ${textColor};
        padding: 10px;
        border-radius: 6px;
        width: 320px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-family: Calibri, sans-serif;
        font-size: 13px;
        border: 1px solid ${borderColor};
    `;

    // Title (Small and clean)
    const title = document.createElement('div');
    title.textContent = name;
    title.style.fontWeight = '600';
    title.style.fontSize = '14px';
    title.style.marginBottom = '4px';
    title.style.color = '#fff';
    modal.appendChild(title);

    // Helper for inputs
    const createInput = (placeholder: string, isTextarea = false, isOptional = false) => {
        const input = isTextarea ? document.createElement('textarea') : document.createElement('input');
        if (isTextarea) {
            (input as HTMLTextAreaElement).rows = 2;
            input.style.resize = 'none';
        }
        input.placeholder = placeholder;
        input.style.cssText = `
            background-color: ${inputBg};
            border: 1px ${isOptional ? 'dashed' : 'solid'} ${isOptional ? '#aaa' : borderColor};
            border-radius: 4px;
            color: ${isOptional ? '#aaa' : textColor};
            padding: 6px;
            width: 100%;
            box-sizing: border-box;
            font-family: inherit;
            font-size: 13px;
            outline: none;
        `;
        input.onfocus = () => { input.style.borderColor = accentColor; };
        input.onblur = () => { input.style.borderColor = isOptional ? '#aaa' : borderColor; };
        return input;
    };

    // Description (Main input)
    const descInput = createInput('Description...', true) as HTMLTextAreaElement;
    modal.appendChild(descInput);

    // Aliases (Optional)
    const aliasInput = createInput('Aliases (comma sep)', false, true);
    modal.appendChild(aliasInput);

    // Image URL (Optional)
    const imgInput = createInput('Image URL', false, true);
    modal.appendChild(imgInput);

    // Buttons Row
    const btnGroup = document.createElement('div');
    btnGroup.style.display = 'flex';
    btnGroup.style.justifyContent = 'flex-end';
    btnGroup.style.gap = '8px';
    btnGroup.style.marginTop = '4px';

    const createBtn = (text: string, isPrimary: boolean, onClick: () => void) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            cursor: pointer;
            border-radius: 4px;
            border: none;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 500;
            background-color: ${isPrimary ? accentColor : '#3f3f3f'};
            color: #ffffff;
            transition: background 0.2s;
        `;
        btn.onmouseover = () => { btn.style.backgroundColor = isPrimary ? '#008be5' : '#4f4f4f'; };
        btn.onmouseout = () => { btn.style.backgroundColor = isPrimary ? accentColor : '#3f3f3f'; };
        btn.onclick = onClick;
        return btn;
    };

    btnGroup.appendChild(createBtn('Cancel', false, () => overlay.remove()));

    btnGroup.appendChild(createBtn('Save', true, async () => {
        const description = descInput.value.trim();
        const aliases = aliasInput.value.split(',').map(s => s.trim()).filter(s => s);
        const imageUrl = imgInput.value.trim();

        // Basic validation
        if (!description && !imageUrl && aliases.length === 0) {
            // Shake effect or visual feedback?
            descInput.style.borderColor = 'red';
            return;
        }

        try {
            await browser.runtime.sendMessage({
                type: 'ADD_CHARACTER',
                novelId,
                name,
                description,
                aliases,
                imageUrl
            });
            overlay.remove();
        } catch (err) {
            console.error(err);
            alert('Failed to save.');
        }
    }));

    modal.appendChild(btnGroup);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Positioning Logic
    if (selectionRect && selectionRect.width > 0) {
        // Since overlay is position: fixed, top/left should be relative to viewport (client coordinates)
        modal.style.visibility = 'hidden';

        requestAnimationFrame(() => {
            const h = modal.offsetHeight;
            const w = modal.offsetWidth;

            // Calculate Top (relative to viewport)
            let finalTop = selectionRect.top - h - 10;

            // If it goes off-screen top, put it below the selection
            if (finalTop < 10) {
                finalTop = selectionRect.bottom + 10;
            }

            // Calculate Left (prevent overflow right)
            let finalLeft = selectionRect.left;
            const viewportWidth = document.documentElement.clientWidth;
            if (finalLeft + w > viewportWidth - 10) {
                finalLeft = viewportWidth - w - 10;
            }
            // Prevent overflow left
            if (finalLeft < 10) {
                finalLeft = 10;
            }

            modal.style.top = `${finalTop}px`;
            modal.style.left = `${finalLeft}px`;
            modal.style.visibility = 'visible';

            descInput.focus();
        });
    } else {
        // Fallback to center
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
    }
}
