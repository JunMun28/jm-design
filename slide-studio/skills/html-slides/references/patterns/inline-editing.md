# Inline editing (opt-in only)

**Only generate any of this if the user explicitly asks for in-browser editing.** It is not part of the default deck.

## Why JS, not CSS

Do **not** use the CSS `~` sibling selector for hover-based show/hide. The CSS-only approach (`edit-hotzone:hover ~ .edit-toggle`) fails: user hovers hotzone → button becomes visible → mouse moves toward button → leaves hotzone → button disappears before click, because `pointer-events: none` on the toggle breaks the hover chain.

Use JS-based hover with a 400ms grace timeout.

## HTML

```html
<div class="edit-hotzone"></div>
<button class="edit-toggle" id="editToggle" title="Edit mode (E)">Edit</button>
```

## CSS

```css
.edit-hotzone {
  position: fixed;
  top: 0; left: 0;
  width: 80px; height: 80px;
  z-index: 10000;
  cursor: pointer;
}
.edit-toggle {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 10001;
}
.edit-toggle.show,
.edit-toggle.active {
  opacity: 1;
  pointer-events: auto;
}
```

## JS

```javascript
const hotzone = document.querySelector(".edit-hotzone");
const editToggle = document.getElementById("editToggle");
let hideTimeout = null;

document.getElementById("editToggle").addEventListener("click", () => editor.toggleEditMode());

hotzone.addEventListener("mouseenter", () => {
  clearTimeout(hideTimeout);
  editToggle.classList.add("show");
});
hotzone.addEventListener("mouseleave", () => {
  hideTimeout = setTimeout(() => {
    if (!editor.isActive) editToggle.classList.remove("show");
  }, 400);
});
editToggle.addEventListener("mouseenter", () => clearTimeout(hideTimeout));
editToggle.addEventListener("mouseleave", () => {
  hideTimeout = setTimeout(() => {
    if (!editor.isActive) editToggle.classList.remove("show");
  }, 400);
});

hotzone.addEventListener("click", () => editor.toggleEditMode());

document.addEventListener("keydown", (e) => {
  if ((e.key === "e" || e.key === "E") && !e.target.getAttribute("contenteditable")) {
    editor.toggleEditMode();
  }
});
```

## Export must strip edit state

`document.documentElement.outerHTML` captures the live DOM — including `contenteditable="true"`, `body.edit-active`, and active classes on the toggle. Anyone opening the saved file would see dashed outlines and a stuck edit banner.

```javascript
exportFile() {
    const editableEls = Array.from(document.querySelectorAll('[contenteditable]'));
    editableEls.forEach(el => el.removeAttribute('contenteditable'));
    document.body.classList.remove('edit-active');

    const editToggle = document.getElementById('editToggle');
    const editBanner = document.querySelector('.edit-banner');
    editToggle?.classList.remove('active', 'show');
    editBanner?.classList.remove('active', 'show');

    const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;

    document.body.classList.add('edit-active');
    editableEls.forEach(el => el.setAttribute('contenteditable', 'true'));
    editToggle?.classList.add('active');
    editBanner?.classList.add('active');

    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'presentation.html';
    a.click();
    URL.revokeObjectURL(a.href);
}
```
