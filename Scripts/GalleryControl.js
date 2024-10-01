/**
 * @file This is a script for an image gallery control
 * @author Vera Konigin vera@groundedwren.com
 * https://groundedwren.neocities.org
 */

window.GW = window.GW || {};
window.GW.Controls = window.GW.Controls || {};
(function Gallery(ns) {
	//#region Data
	/**
	* FOR YOU TO UPDATE
	* 
	* Modify this object to describe the images you want to display on your page!
	* If you want multiple image galleries, you can create other objects below this to describe them.
	* "Example1" should be changed to the "name" you give to your <gw-gallery> element :)
	*/
	ns.Example1 = {
		imageList: [ //The filenames of your images in the order you want them to appear. The default is for the gallery to start at the latest (last) image.
			"Slide1",
			"Slide2",
		],
		imageFolder: "https://groundedwren.neocities.org/img", //Where all the image files on your site live
		imageInfo: {
			"Slide1": {
				title: "Title One", //This is the display name for your image
				date: new Date("October 10, 2023"), //This is the date which will display by your image title
				alt: "Alternative text 1", //This is text displayed to those using screen readers or visually when the image doesn't load
				extension: "png" //The file type of your image
			},
			"Slide2": {
				title: "Title Two",
				date: new Date("October 11, 2023"),
				alt: "Alternative text 2",
				extension: "png"
			},
		}
	};
	//#endregion

	//#region GalleryEl
	ns.GalleryEl = class GalleryEl extends HTMLElement {
		//static properties
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//instance properties
		instanceId;
		curImg;

		btnPrev;
		btnNext;
		figureContainer;
		minImgWidth;
		minImgHeight;
		maxImgHeight;
		reflowWidth;

		constructor() {
			super();
			this.instanceId = GalleryEl.instanceCount++;
			GalleryEl.instanceMap[this.instanceId] = this;

			if(this.instanceId === 0) {
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
							justify-items: center;
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
						}
					}
				</style>`);
			}
		}

		get idKey() {
			return `gw-gallery-${this.instanceId}`;
		}

		//#region HTMLElement implementation
		connectedCallback() {
			this.name = this.getAttribute("name");
			this.minImgWidth = this.getAttribute("minImgWidth");
			this.minImgHeight = this.getAttribute("minImgHeight");
			this.maxImgHeight = this.getAttribute("maxImgHeight");
			this.reflowWidth = this.getAttribute("reflowWidth");

			if(this.reflowWidth) {
				document.head.insertAdjacentHTML("beforeend", `
				<style>
					#${this.idKey}-container {
						@container(max-width: ${this.reflowWidth || "0px"}) {
							.gallery {
								grid-template-columns: 1fr 1fr;
								grid-template-rows: 1fr auto;
							}
							.figure-container {
								grid-row: 1;
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
			<section id="${this.idKey}-container" class="gw-gallery-container" aria-label="${this.name} image gallery">
				<div class="gallery">
					<button id="${this.idKey}-prevImg" class="nav-button" aria-labelledby="prevTitle">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512">
							<title id="prevTitle">Previous</title>
							<!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. -->
							<path d="M9.4 278.6c-12.5-12.5-12.5-32.8 0-45.3l128-128c9.2-9.2 22.9-11.9 34.9-6.9s19.8 16.6 19.8 29.6l0 256c0 12.9-7.8 24.6-19.8 29.6s-25.7 2.2-34.9-6.9l-128-128z"></path>
						</svg>
					</button>
					<div class="figure-container"></div>
					<button id="${this.idKey}-nextImg" class="nav-button" aria-labelledby="nextTitle">
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
			this.btnPrev = document.getElementById(`${this.idKey}-prevImg`);
			this.btnNext = document.getElementById(`${this.idKey}-nextImg`);
			this.figureContainer = this.querySelector(`.figure-container`);
		}

		//#region Handlers
		registerHandlers() {
			this.btnPrev.onclick = () => {
				const imageList = ns[this.name].imageList;
				let curIdx = imageList.indexOf(this.curImg);
				if(curIdx < 0) { curIdx = 0; }

				const newIdx = curIdx === 0
					? imageList.length - 1
					: curIdx - 1;
				this.loadImage(imageList[newIdx]);
			};

			this.btnNext.onclick = () => {
				const imageList = ns[this.name].imageList;
				let curIdx = imageList.indexOf(this.curImg);
				if(curIdx < 0) { curIdx = 0; }

				const newIdx = curIdx === (imageList.length - 1)
					? 0
					: curIdx + 1;
				this.loadImage(imageList[newIdx]);
			};

			window.addEventListener("load", () => {  
				const urlParams = new URLSearchParams(window.location.search);
				const imageList = ns[this.name].imageList;

				const imageName = urlParams.has(this.name)
					? urlParams.get(this.name)
					: imageList[imageList.length - 1];

				this.loadImage(imageName);
			});
		}

		loadImage(imageName) {
			this.curImg = imageName;
			const galFig = document.createElement("gw-gallery-figure");
			galFig.name = this.name;
			galFig.image = this.curImg;
			galFig.minImgWidth = this.minImgWidth;
			galFig.minImgHeight = this.minImgHeight;
			galFig.maxImgHeight = this.maxImgHeight;

			galFig.onImgLoaded = () => {
				this.figureContainer.replaceChildren(galFig);
				this.figureContainer.ariaLive = "polite"; //we don't want to announce changes until after initial load
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

			params[this.name] = imageName;

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
		static instanceCount = 0;
		static instanceMap = {};

		//instance properties
		instanceId;
		name;
		image;
		onImgLoaded;
		minImgWidth;

		galleryImg;

		constructor() {
			super();
			this.instanceId = FigureEl.instanceCount++;
			FigureEl.instanceMap[this.instanceId] = this;

			if(this.instanceId === 0) {
				document.head.insertAdjacentHTML("beforeend",`
				<style>
					.gw-gallery-figure {
						box-sizing: border-box;
						margin: 0;
		
						img {
							max-width: 100%;
							min-width: auto;
		
							max-height: none;
							min-height: auto;
		
							border: 3px solid var(--border-color, black);

							opacity: 0;
							transition: opacity 0.15s linear;
						}
		
						.page-num {
							float: right;
							margin-left: 2px;
						}
					}
				</style>`);
			}
		}

		renderContent() {
			const imageList = ns[this.name].imageList;
			const imageInfo = ns[this.name].imageInfo[this.image];

			//Markup
			this.innerHTML = `
			<figure class="gw-gallery-figure">
				<img
					alt="${imageInfo.alt}"
					style="min-width: ${this.minImgWidth || auto}; max-height: ${this.maxImgHeight || "none"}; min-height: ${this.minImgHeight || "auto"}; "
				>
				<figcaption>
					<span>${imageInfo.title}</span>
					<time datetime="${imageInfo.date.toISOString()}">(${
						imageInfo.date.toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' })
					})</time>
					<span class="page-num">#${imageList.indexOf(this.image)+1} of ${imageList.length}</span>
				</figcaption>
			</figure>
			`;

			//element properties
			this.galleryImg = this.querySelector(`img`);
			this.galleryImg.onload = () => {
				setTimeout(() => { this.galleryImg.style.opacity = "1"; }, 10);
				this.onImgLoaded();
			};
			this.galleryImg.src=`${ns[this.name].imageFolder}/${this.image}.${imageInfo.extension}`;
		}
	};
	customElements.define("gw-gallery-figure", ns.FigureEl);
	//endregion
}) (window.GW.Controls.Gallery = window.GW.Controls.Gallery || {});