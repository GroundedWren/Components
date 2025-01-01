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
		static ResetMs = 500;

		InstanceId;
		IsInitialized;
		IdIter = 0;
		KeyMap = {};
		CurKeySequence = [];
		LastKeyTimestamp = new Date(-8640000000000000); //Earliest representable date

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
							display: flex;
							gap: 2px;

							> svg {
								width: 1em;
								height: 1em;
							}
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

		get LegendEl() {
			return this.querySelector("legend");
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
			this.KeyMap = {};

			if(!this.LegendEl.hasAttribute("data-checklistbox-has-icon")) {
				this.LegendEl.insertAdjacentHTML(
					"beforeend",
					`<svg viewBox="0 0 576 512" class="gw-icon" aria-hidden="true"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><title>Use arrow keys or type an option to navigate.</title><path d="M64 64C28.7 64 0 92.7 0 128V384c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H64zm16 64h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16zM64 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V240zm16 80h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V336c0-8.8 7.2-16 16-16zm80-176c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V144zm16 80h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V240c0-8.8 7.2-16 16-16zM160 336c0-8.8 7.2-16 16-16H400c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V336zM272 128h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H272c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16zM256 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H272c-8.8 0-16-7.2-16-16V240zM368 128h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H368c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16zM352 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H368c-8.8 0-16-7.2-16-16V240zM464 128h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H464c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16zM448 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H464c-8.8 0-16-7.2-16-16V240zm16 80h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H464c-8.8 0-16-7.2-16-16V336c0-8.8 7.2-16 16-16z"></path></svg>`
				);
				this.LegendEl.setAttribute("data-checklistbox-has-icon", "true");
			}
			
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

				this.addToKeyMap(inputEl.parentElement.innerText.toLowerCase(), inputEl);

				if(!this.ActiveDescendant || (!hasChecked && inputEl.checked)) {
					if(inputEl.checked) {
						hasChecked = true;
					}
					this.setActiveInput(inputEl);
				}
			});

			this.IsInitialized = true;
		};

		addToKeyMap(text, inputEl) {
			let currentLevel = this.KeyMap;
			text.split("").forEach(character => {
				currentLevel[character] = currentLevel[character] || {};
				currentLevel = currentLevel[character];
				(currentLevel.InputElAry = currentLevel.InputElAry || []).push(inputEl);
			});
		}

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
					newInputEl = this.getFirstMatch(event.key.toLowerCase());
					break;
			}
			if(newInputEl) {
				event.preventDefault();
				this.setActiveInput(newInputEl);
			}
		};

		getFirstMatch(key) {
			const keyTimestamp = new Date();
			if(keyTimestamp - this.LastKeyTimestamp > CheckListboxEl.ResetMs) {
				this.CurKeySequence = [];
			}
			this.LastKeyTimestamp = keyTimestamp;

			this.CurKeySequence.push(key);

			let sequenceObj = this.KeyMap;
			this.CurKeySequence.forEach(key => sequenceObj = sequenceObj[key] || {});

			if(!sequenceObj.InputElAry) {
				if(this.KeyMap[key]?.InputElAry) {
					this.CurKeySequence = [key];
					sequenceObj = this.KeyMap[key];
				}
				else {
					this.CurKeySequence = [];
					return null;
				}
			}

			if (sequenceObj.InputElAry.length === 1) {
				this.CurKeySequence = [];
			}
			return sequenceObj.InputElAry[0];
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