/**
 * @file Control for a listbox of checkboxes
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Controls = window.GW.Controls || {};
(function CheckListbox(ns) {
	ns.CheckListboxEl = class CheckListboxEl extends HTMLElement {
		static InstanceCount = 0;
		static InstanceMap = {};

		InstanceId;
		IsInitialized;
		IdIter = 0;

		constructor() {
			super();
			this.InstanceId = CheckListboxEl.InstanceCount++;
			CheckListboxEl.InstanceMap[this.InstanceId] = this;

			if(this.InstanceId === 0) {
				document.head.insertAdjacentHTML("beforeend", `
				<style>
					gw-check-listbox fieldset {
						border-color: var(--link-color, #0000EE);
						background-color: var(--button-face-color, #C8C8C8);

						legend {
							background-color: var(--button-face-color, #C8C8C8);
							border-radius: 20px;
						}
					}	
				</style>`);
			}
		}

		getId(key) {
			return `gw-check-listbox-${this.InstanceId}-${key}`;
		}
		getRef(key) {
			return this.querySelector(`#${this.getId(key)}`);
		}

		get FieldsetEl() {
			return this.querySelector("fieldset");
		}

		get InputElAry() {
			return [...this.querySelectorAll("input")];
		}

		get ActiveDescendant() {
			return this.FieldsetEl.getAttribute("aria-activedescendant");
		}
		set ActiveDescendant(value) {
			if(value) {
				this.FieldsetEl.setAttribute("aria-activedescendant", value);
			}
			else {
				this.FieldsetEl.removeAttribute("aria-activedescendant");
			}
		}

		connectedCallback() {
			if(!this.IsInitialized) {
				const observer = new MutationObserver((_mutationList, _observer) => {});
				observer.observe(this, {attributes: true, childList: false, subtree: false});

				if(document.readyState === "loading") {
					document.addEventListener("DOMContentLoaded", this.renderContent);
				}
				else {
					this.renderContent();
				}
			}
		}

		renderContent = () => {
			this.FieldsetEl.setAttribute("role", "listbox");
			this.ActiveDescendant = null;

			let hasChecked = false;
			this.InputElAry.forEach(inputEl => {
				if(!inputEl.hasAttribute("data-checklistbox-listening")) {
					inputEl.addEventListener("click", this.onInputClick);
					inputEl.addEventListener("keydown", this.onInputKeydown);
					inputEl.setAttribute("data-checklistbox-listening", "true");
				}
				Object.entries({
					"id": inputEl.id || this.getId(this.IdIter++),
					"role": "option",
					"tabindex": "-1",
					"aria-selected": inputEl.checked}
				).forEach(
					([attribute, value]) => inputEl.setAttribute(attribute, value)
				);

				if(!this.ActiveDescendant || (!hasChecked && inputEl.checked)) {
					if(inputEl.checked) {
						hasChecked = true;
					}
					this.setActiveInput(inputEl);
				}
			});

			this.IsInitialized = true;
		};

		onInputClick = (event) => {
			const inputEl = event.target;
			inputEl.setAttribute("aria-selected", inputEl.checked);
			this.setActiveInput(inputEl);
		};

		onInputKeydown = (event) => {
			let newInputEl = null;
			const labelEl = event.target.parentElement;

			switch(event.key) {
				case "ArrowRight":
				case "ArrowDown":
					if(labelEl.nextElementSibling) {
						newInputEl = labelEl.nextElementSibling.querySelector("input");
					}
					break;
				case "ArrowLeft":
				case "ArrowUp":
					if(labelEl.previousElementSibling) {
						newInputEl = labelEl.previousElementSibling.querySelector("input");
					}
					break;
				case "Home":
					newInputEl = this.querySelector(`label:first-of-type input`);
					break;
				case "End":
					newInputEl = this.querySelector(`label:last-of-type input`);
					break;
				default:
					newInputEl = this.getFirstMatch(event.key);
					break;
			}
			if(newInputEl) {
				event.preventDefault();
				this.setActiveInput(newInputEl);
			}
		};

		getFirstMatch(key) {
			///TODO
		}

		setActiveInput(inputEl) {
			if(this.ActiveDescendant) {
				this.querySelector(`#${this.ActiveDescendant}`).setAttribute("tabindex", "-1");
			}
			inputEl.setAttribute("tabindex", "0");
			inputEl.focus();
			this.ActiveDescendant = inputEl.id;
		}
	}
	customElements.define("gw-check-listbox", ns.CheckListboxEl);
}) (window.GW.Controls.CheckListbox = window.GW.Controls.CheckListbox || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.CheckListbox");