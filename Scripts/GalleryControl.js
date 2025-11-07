/**
 * @file This is a script for an image gallery control
 * @author Vera Konigin vera@groundedwren.com
 * https://groundedwren.neocities.org
 */

window.GW = window.GW || {};
window.GW.Controls = window.GW.Controls || {};
(function Gallery(ns) {
	//#region GalleryEl
	ns.Data = ns.Data || {};
	ns.GalleryEl = class GalleryEl extends HTMLElement {
		//static properties
		static InstanceCount = 0;
		static InstanceMap = {};
		//#endregion

		//instance properties
		InstanceId;
		CurImg;

		BtnPrev;
		BtnNext;
		FigureContainer;
		MinImgWidth;
		MinImgHeight;
		MaxImgHeight;
		ReflowWidth;
		StartAt;

		constructor() {
			super();
			this.InstanceId = GalleryEl.InstanceCount++;
			GalleryEl.InstanceMap[this.InstanceId] = this;

			if(this.InstanceId === 0) {
				document.head.insertAdjacentHTML("beforeend",`
				<style>
					.gw-gallery-container {
						*, *::before, *::after {
							box-sizing: border-box;
						}
						
						container-type: inline-size;
		
						.gallery {
							display: grid;
							grid-template-columns: auto 1fr auto;
							gap: 10px;
							align-items: stretch;
						}
		
						.figure-container {
							max-width: 100%;
							overflow-x: auto;
						}
						.nav-button {
							display: flex;
							flex-direction: column;
							justify-content: center;
							
							width: 35px;
							path {
								fill: var(--icon-color);
							}

							&:last-of-type {
								justify-self: end;
							}
						}
					}
					[dir="rtl"] {
						.gw-gallery-container {
							.nav-button {
								transform: rotate(180deg);
							}
						}
					}
				</style>`);
			}
		}

		get IdKey() {
			return `gw-gallery-${this.InstanceId}`;
		}

		//#region HTMLElement implementation
		connectedCallback() {
			this.Name = this.getAttribute("name");
			this.MinImgWidth = this.getAttribute("minImgWidth");
			this.MinImgHeight = this.getAttribute("minImgHeight");
			this.MaxImgHeight = this.getAttribute("maxImgHeight");
			this.ReflowWidth = this.getAttribute("reflowWidth");
			this.StartAt = parseInt(this.getAttribute("startAt"));

			if(this.ReflowWidth) {
				document.head.insertAdjacentHTML("beforeend", `
				<style>
					#${this.IdKey}-container {
						@container(max-width: ${this.ReflowWidth || "0px"}) {
							.gallery {
								grid-template-columns: 1fr 1fr;
								grid-template-rows: auto 1fr;
							}
							.figure-container {
								grid-row: 2;
								grid-column: 1 / -1;
							}
						}
					}
				</style>`);
			}

			this.renderContent();
			this.registerHandlers();
		}
		//#endregion

		renderContent() {
			//Markup
			this.innerHTML = `
			<section id="${this.IdKey}-container" class="gw-gallery-container" aria-label="${this.Name}" aria-roledescription="Carousel">
				<div class="gallery">
					<button id="${this.IdKey}-prevImg" class="nav-button" aria-labelledby="prevTitle">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512">
							<title id="prevTitle">Previous</title>
							<!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. -->
							<path d="M9.4 278.6c-12.5-12.5-12.5-32.8 0-45.3l128-128c9.2-9.2 22.9-11.9 34.9-6.9s19.8 16.6 19.8 29.6l0 256c0 12.9-7.8 24.6-19.8 29.6s-25.7 2.2-34.9-6.9l-128-128z"></path>
						</svg>
					</button>
					<div class="figure-container"></div>
					<button id="${this.IdKey}-nextImg" class="nav-button" aria-labelledby="nextTitle">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512">
							<title id="nextTitle">Next</title>
							<!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. -->
							<path d="M246.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-9.2-9.2-22.9-11.9-34.9-6.9s-19.8 16.6-19.8 29.6l0 256c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l128-128z"></path>
						</svg>
					</button>
				</div>
			</section>
			`;

			//element properties
			this.BtnPrev = this.querySelector(`#${this.IdKey}-prevImg`);
			this.BtnNext = this.querySelector(`#${this.IdKey}-nextImg`);
			this.FigureContainer = this.querySelector(`.figure-container`);
		}

		//#region Handlers
		registerHandlers() {
			this.BtnPrev.onclick = () => {
				const imageList = ns.Data[this.Name].ImageList;
				let curIdx = imageList.indexOf(this.CurImg);
				if(curIdx < 0) { curIdx = 0; }

				const newIdx = curIdx === 0
					? imageList.length - 1
					: curIdx - 1;
				this.loadImage(imageList[newIdx]);
			};

			this.BtnNext.onclick = () => {
				const imageList = ns.Data[this.Name].ImageList;
				let curIdx = imageList.indexOf(this.CurImg);
				if(curIdx < 0) { curIdx = 0; }

				const newIdx = curIdx === (imageList.length - 1)
					? 0
					: curIdx + 1;
				this.loadImage(imageList[newIdx]);
			};

			window.addEventListener("DOMContentLoaded", () => {  
				const urlParams = new URLSearchParams(window.location.search);
				const imageList = ns.Data[this.Name].ImageList;
				const fallbackImgIdx = (!isNaN(this.StartAt) && this.StartAt >= 0 && this.StartAt < imageList.length)
					? this.StartAt
					: imageList.length - 1;

				const imageName = urlParams.has(this.Name)
					? urlParams.get(this.Name)
					: imageList[fallbackImgIdx];

				this.loadImage(imageName);
			});
		}

		loadImage(imageName) {
			this.CurImg = imageName;
			const galFig = document.createElement("gw-gallery-figure");
			galFig.Name = this.Name;
			galFig.Image = this.CurImg;
			galFig.MinImgWidth = this.MinImgWidth;
			galFig.MinImgHeight = this.MinImgHeight;
			galFig.MaxImgHeight = this.MaxImgHeight;

			if(!this.FigureContainer.children.length) {
				this.FigureContainer.replaceChildren(galFig);
			}

			galFig.ImgLoadedCallback = () => {
				this.FigureContainer.replaceChildren(galFig);
				this.FigureContainer.ariaLive = "polite"; //we don't want to announce changes until after initial load
				this.updateLocation(imageName);
			};
			galFig.renderContent();
		}

		updateLocation(imageName) {
			let params = window.location.search.replaceAll("?","").split("&").reduce((acc, cur) => {
				if(!cur) {return acc;}

				let pieces = cur.split("=");
				acc[pieces[0]] = pieces[1];
				return acc;
			}, {});

			params[this.Name] = imageName;

			const paramsStr = Object.keys(params).reduce((acc, cur) => {
				if(!acc.length)
				{
					acc = "?";
				}
				else
				{
					acc = acc + "&";
				}
				return acc + cur + "=" + params[cur];
			}, "");
			window.history.replaceState(null, "", paramsStr);
		}
		//#endregion
	};
	customElements.define("gw-gallery", ns.GalleryEl);
	//#endregion

	//#region FigureEl
	ns.FigureEl = class FigureEl extends HTMLElement {
		//static properties
		static InstanceCount = 0;
		static InstanceMap = {};

		//instance properties
		InstanceId;
		Name;
		Image;
		ImgLoadedCallback;
		MinImgWidth;

		GalleryImg;

		constructor() {
			super();
			this.InstanceId = FigureEl.InstanceCount++;
			FigureEl.InstanceMap[this.InstanceId] = this;

			if(this.InstanceId === 0) {
				document.head.insertAdjacentHTML("beforeend",`
				<style>
					.gw-gallery-figure {
						box-sizing: border-box;
						margin: 0;
						display: grid;
						grid-auto-flow: row;
		
						img {
							justify-self: center;
							max-width: 100%;
							min-width: auto;
		
							max-height: none;
							min-height: auto;
		
							border: 3px solid var(--border-color, black);

							opacity: 0;
							transition: opacity 0.15s linear;
						}

						figcaption {
							display: grid;
							grid-template-columns: auto auto 1fr;
							gap: 2px;
							
							.page-num {
								white-space: nowrap;
								justify-self: end;
							}
						}
					}
				</style>`);
			}
		}

		renderContent() {
			const imageList = ns.Data[this.Name].ImageList;
			const imageInfo = ns.Data[this.Name].ImageInfo[this.Image];

			//Markup
			this.innerHTML = `
			<figure class="gw-gallery-figure" aria-roledescription="slide">
				<img
					alt="${imageInfo.Alt}"
					style="min-width: ${this.MinImgWidth || "auto"}; max-height: ${this.MaxImgHeight || "none"}; min-height: ${this.MinImgHeight || "auto"}; "
				>
				<figcaption>
					<cite>${imageInfo.Cite
						? `<a href="${imageInfo.Cite}">${imageInfo.Title}</a>`
						: imageInfo.Title}
					</cite>
					<time datetime="${imageInfo.Date.toISOString()}">(${
						imageInfo.Date.toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' })
					})</time>
					<span class="page-num">#${imageList.indexOf(this.Image)+1} of ${imageList.length}</span>
				</figcaption>
			</figure>
			`;

			//element properties
			this.GalleryImg = this.querySelector(`img`);
			this.GalleryImg.onload = () => {
				setTimeout(() => { this.GalleryImg.style.opacity = "1"; }, 50);
				this.ImgLoadedCallback();
			};
			this.GalleryImg.src=`${ns.Data[this.Name].ImageFolder}/${this.Image}.${imageInfo.Extension}`;
		}
	};
	customElements.define("gw-gallery-figure", ns.FigureEl);
	//endregion
}) (window.GW.Controls.Gallery = window.GW.Controls.Gallery || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.Gallery");