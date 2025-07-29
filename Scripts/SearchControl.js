/**
 * @file Script for a site search control
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Controls = window.GW.Controls || {};
(function Search(ns) {
	ns.Data = ns.Data || {};

	ns.SearchEl = class SearchEl extends HTMLElement {
		static InstanceCount = 0;
		static InstanceMap = {};

		InstanceId;
		IsInitialized;
		SearchIndex;

		constructor() {
			super();
			this.InstanceId = SearchEl.InstanceCount++;
			SearchEl.InstanceMap[this.InstanceId] = this;

			if(this.InstanceId === 0) {
				document.head.insertAdjacentHTML("beforeend", `
				<style>
					gw-search {
						display: flex;
						justify-content: center;
						padding-block-start: 3px;
		
						form {
							border: 0;
						}
						
						label {
							display: flex;
							flex-direction: row;
							align-items: center;
							gap: 2px;
						}
		
						svg {
							width: 22px;
							height: 22px;
							
							path {
								fill: var(--icon-color);
							}
						}
						
						[popover="auto"] {
							text-align: center;
							overflow: auto;
							max-height: 100%;
							max-width: 100%;
							ol {
								text-align: start;
								padding-inline: 40px;
							}
						}
					}	
				</style>`);
			}
		}

		getId(key) {
			return `gw-search-${this.InstanceId}-${key}`;
		}
		getRef(key) {
			return this.querySelector(`#${CSS.escape(this.getId(key))}`);
		}

		get FormEl() {
			return this.getRef("form");
		}
		get SearchEl() {
			return this.getRef("search");
		}
		get PopoverEl() {
			return this.getRef("popover");
		}

		get SearchData() {
			return ns.Data[this.getAttribute("dataKey")] || {};
		}

		connectedCallback() {
			if(!this.IsInitialized) {
				const observer = new MutationObserver(() => this.buildSearchIndex());
				observer.observe(this, {attributes: true, childList: false, subtree: false});

				this.buildSearchIndex();
				this.renderContent();
			}
		}

		/**
		 * Rebuilds the search index based on the dataKey attribute
		 */
		buildSearchIndex() {
			this.SearchIndex = Object.keys(this.SearchData).reduce((index, pageKey) => {
				this.SearchData[pageKey].Terms.forEach(term => {
					index[term] = index[term] || [];
					index[term].push(pageKey);
				});
				return index;
			}, {});
		}

		renderContent() {
			this.innerHTML = `
			<form id="${this.getId("form")}" role="search">
				<label>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
						<!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. -->
						<title>Find page</title>
						<path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM288 176c0-44.2-35.8-80-80-80s-80 35.8-80 80c0 48.8 46.5 111.6 68.6 138.6c6 7.3 16.8 7.3 22.7 0c22.1-27 68.6-89.8 68.6-138.6zm-112 0a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/>
					</svg>
					<input id="${this.getId("search")}" type="text">
				</label>
				<div id="${this.getId("popover")}" popover="auto" tabindex="-1"></div>
			</form>
			`;

			this.FormEl.addEventListener("submit", this.onSubmit);
		}

		onSubmit = (event) => {
			const searchTerms = this.SearchEl.value.split(" ").map(val => val.toUpperCase());
			const matches = this.findMatches(searchTerms);

			this.PopoverEl.innerHTML = `
			<strong id=${this.getId("strMatch")}>Matching Pages</strong>
			${matches.length
				? `<ol aria-labelledby="${this.getId("strMatch")}">
						${matches.map(match => {
							let pageObj = this.SearchData[match.Key];
							return `
							<li>
								<em>${pageObj.Category}</em> / <strong>
									<a href="${pageObj.URL}" tabindex="0">${pageObj.DisplayName || match.Key}</a>
								</strong>
							</li>`
						}).join("")}
					</ol>`
				: `<br><em>No matches</em>`
			}
			`;

			this.PopoverEl.showPopover();
			this.PopoverEl.focus();

			event.preventDefault();
			this.FormEl.reset();
		};

		findMatches(searchTerms) {
			let results = {};
			for(const term of searchTerms) {
				const pageList = this.SearchIndex[term];
				pageList?.forEach(pageKey => {
					const result = results[pageKey] || {Key: pageKey, Score: 0};
					result.Score += 1;
					results[pageKey] = result;
				});
			}
			return Object.values(results).sort((a, b) => b.Score - a.Score);
		}
	}
	customElements.define("gw-search", ns.SearchEl);
}) (window.GW.Controls.Search = window.GW.Controls.Search || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.Search");