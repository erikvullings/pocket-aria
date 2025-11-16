# mithril-materialized: Materialize CSS Components for Mithril.js

This document provides a concise, agent-friendly guide to using the mithril-materialized library in Mithril.js applications. It focuses exclusively on controlled mode for all components, where the parent component manages state via value/values props and onchange handlers. This ensures predictable, testable code for forms and interactive UIs.

Uncontrolled mode (using defaultValue/defaultValues) is not covered here, as per request. For the distinction, controlled mode requires explicit state management in the parent, while uncontrolled uses internal component state.

## Installation

### Install via npm:

```bash
npm install mithril-materialized
````

Import components as needed:

```ts
import m from 'mithril';
import { TextInput, Button, Select } from 'mithril-materialized';
```

Ensure the CSS is included in your project (e.g., in `index.ts`):

```ts
import "mithril-materialized/index.css";
```

Usage Notes

- All examples assume a Mithril view function.
- Controlled mode: Pass `value` (string/number/etc.) or values (object for groups) and `onchange` (function receiving new value).
- Common props: `id`, `class`, `label`, `required`, `disabled`, `oncreate`, `onupdate` (Mithril lifecycle).
- Examples use a simple state object, e.g., `let state = { input: '' };` and updater `onchange: (v) => state.input = v`.
- TypeScript support: Props are typed; import types if using TS.

## Components

### TextInput

Description: Single-line text input field with Materialize styling.

Key Props:

| Prop         | Type     | Description                           | Required               |
| ------------ | -------- | ------------------------------------- | ---------------------- |
| `value`      | string   | Current value (controlled)            | No                     |
| `onchange`   | function | Handler for value change              | Yes for controlled     |
| `label`      | string   | Input label                           | No                     |
| `id`         | string   | Unique ID                             | No                     |
| `required`   | boolean  | Mark as required                      | No                     |
| `helperText` | string   | Helper text below input               | No                     |
| `icon`       | string   | Leading icon name                     | No                     |
| `type`       | string   | Input type (e.g., 'text', 'password') | No, defaults to 'text' |

### Controlled Example:

```ts
let state = { name: '' };

view(vnode) {
  return m('.row', [
    m(TextInput, {
      label: 'What is your name?',
      id: 'name-input',
      required: true,
      helperText: 'Enter your full name',
      value: state.name,
      onchange: (value) => { state.name = value; }
    })
  ]);
}
````

## Button

Description: Standard Materialize button.

Key Props:

| Prop      | Type     | Description                            | Required         |
| --------- | -------- | -------------------------------------- | ---------------- |
| label     | string   | Button text                            | Yes              |
| `onclick` | function | Click handler                          | No               |
| type      | string   | Button type (e.g., 'button', 'submit') | No               |
| disabled  | boolean  | Disable button                         | No               |
| waves     | boolean  | Enable ripple effect                   | No, default true |

Controlled Example (Note: Buttons are stateless; controlled via parent logic):

```ts
let state = { count: 0 };

view(vnode) {
  return m('.row', [
    m(Button, {
      label: `Count: ${state.count}`,
      onclick: () => state.count++,
      type: 'button',
      waves: true
    })
  ]);
}
````

## RangeInput

Description: Slider input for numeric ranges.

Key Props:

| Prop       | Type     | Description              | Required           |
| ---------- | -------- | ------------------------ | ------------------ |
| value      | number   | Current value (0-100)    | No                 |
| `onchange` | function | Handler for value change | Yes for controlled |
| label      | string   | Slider label             | No                 |
| min        | number   | Minimum value            | No, default 0      |
| max        | number   | Maximum value            | No, default 100    |
| step       | number   | Step increment           | No, default 1      |

Controlled Example:

```ts
let state = { volume: 50 };

view(vnode) {
  return m('.row', [
    m(RangeInput, {
      label: 'Volume',
      value: state.volume,
      min: 0,
      max: 100,
      step: 1,
      onchange: (value) => { state.volume = value; }
    })
  ]);
}
```

### DatePicker

Description: Materialize date picker.

Key Props:

| Prop        | Type     | Description                        | Required           |
| ----------- | -------- | ---------------------------------- | ------------------ |
| value       | string   | Current date (ISO format)          | No                 |
| `onchange`  | function | Handler for date change            | Yes for controlled |
| label       | string   | Picker label                       | No                 |
| format      | string   | "Date format (e.g., 'yyyy-mm-dd')" | No                 |
| placeholder | string   | Placeholder text                   | No                 |

Controlled Example:

```ts
let state = { selectedDate: '' };

view(vnode) {
  return m('.row', [
    m(DatePicker, {
      label: 'Select Date',
      value: state.selectedDate,
      format: 'yyyy-mm-dd',
      onchange: (value) => { state.selectedDate = value; }
    })
  ]);
}
```

## DataTable

Description: Interactive data table with sorting and pagination.

Key Props:

| Prop       | Type     | Description                     | Required           |
| ---------- | -------- | ------------------------------- | ------------------ |
| values     | array    | Array of row data objects       | Yes                |
| columns    | array    | Column definitions {key, label} | Yes                |
| selected   | array    | Selected row IDs (controlled)   | No                 |
| `onchange` | function | Handler for selection change    | Yes for controlled |
| sortable   | boolean  | Enable sorting                  | No, default true   |

Controlled Example:

```ts
let state = { selected: [] };
let data = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];

view(vnode) {
  return m(DataTable, {
    values: data,
    columns: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }],
    selected: state.selected,
    onchange: (selected) => { state.selected = selected; },
    sortable: true
  });
}
```

### TreeView

Description: Hierarchical tree view for nested data.

Key Props:

| Prop       | Type     | Description                   | Required           |
| ---------- | -------- | ----------------------------- | ------------------ |
| values     | array    | Tree nodes {label, children?} | Yes                |
| selected   | string   | Selected node ID (controlled) | No                 |
| `onchange` | function | Handler for selection         | Yes for controlled |
| expandable | boolean  | Allow node expansion          | No, default true   |

Controlled Example:

```ts
let state = { selectedNode: '' };
let treeData = [{ id: 'root', label: 'Root', children: [{ id: 'child', label: 'Child' }] }];

view(vnode) {
  return m(TreeView, {
    values: treeData,
    selected: state.selectedNode,
    onchange: (id) => { state.selectedNode = id; },
    expandable: true
  });
}
```

