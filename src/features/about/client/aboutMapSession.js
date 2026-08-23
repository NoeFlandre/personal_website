import { getPlaceTypeLabel, parsePlacesDataset } from "../utils/aboutMap.js";
import { createMapRuntime } from "./aboutMapInteractionCoordinator.js";

export {
  applyPopupViewportOptions,
  createMapInteractionCoordinator,
  createMapRuntime,
  getCardSelection,
  getCardSelectionCenter,
  getCardSelectionOffset,
  getMarkerOffsets,
  highlightMapSelection,
  moveMapToSelection,
  openPopupFromCardSelection,
  shouldMoveMap,
  updateMapVisibility,
} from "./aboutMapInteractionCoordinator.js";

export function hasCardsNavigationElements(cardsViewport, cardsPrev, cardsNext) {
  return Boolean(cardsViewport) && Boolean(cardsPrev) && Boolean(cardsNext);
}

export function updateCardsNavState(root, cardsViewport, cardsPrev, cardsNext) {
  if (!hasCardsNavigationElements(cardsViewport, cardsPrev, cardsNext)) return;

  const maxScrollLeft = cardsViewport.scrollWidth - cardsViewport.clientWidth;
  const canScroll = maxScrollLeft > 2;
  root.dataset.cardsScrollable = canScroll ? "true" : "false";
  cardsPrev.disabled = !canScroll || cardsViewport.scrollLeft <= 2;
  cardsNext.disabled = !canScroll || cardsViewport.scrollLeft >= maxScrollLeft - 2;
}

export function bindCardsNavigation({
  root,
  cardsViewport,
  cardsPrev,
  cardsNext,
  signal,
  windowRef,
}) {
  const updateCardsNav = () => updateCardsNavState(root, cardsViewport, cardsPrev, cardsNext);

  const scrollCards = (direction) => {
    if (!cardsViewport) return;
    cardsViewport.scrollBy({
      left: direction * cardsViewport.clientWidth,
      behavior: "smooth",
    });
  };

  if (root.dataset.mapUiBindings !== "true") {
    cardsPrev?.addEventListener(
      "click",
      () => {
        scrollCards(-1);
      },
      { signal }
    );

    cardsNext?.addEventListener(
      "click",
      () => {
        scrollCards(1);
      },
      { signal }
    );

    cardsViewport?.addEventListener(
      "scroll",
      () => {
        updateCardsNav();
      },
      { signal }
    );

    windowRef?.addEventListener("resize", updateCardsNav, { signal });

    root.dataset.mapUiBindings = "true";
  }

  return updateCardsNav;
}

export function getMapMountElements(root) {
  return {
    cardButtons: Array.from(root.querySelectorAll("[data-place-id]")),
    cardsNext: root.querySelector("[data-cards-next]"),
    cardsPrev: root.querySelector("[data-cards-prev]"),
    cardsViewport: root.querySelector("[data-cards-viewport]"),
    filterButtons: Array.from(root.querySelectorAll("[data-filter]")),
    mapElement: root.querySelector("[data-map-canvas]"),
    mapPlaces: parsePlacesDataset(root.dataset.places),
  };
}

export function canMountMap({ mapElement, filterButtons, cardButtons, mapPlaces }) {
  return (
    Boolean(mapElement) &&
    filterButtons.length > 0 &&
    cardButtons.length > 0 &&
    mapPlaces.length > 0
  );
}

export function resetLeafletContainer(mapElement) {
  if (!mapElement.classList.contains("leaflet-container")) return;
  mapElement.innerHTML = "";
  mapElement.classList.remove("leaflet-container");
}

export function initializeLeafletMap(leaflet, mapElement) {
  const map = leaflet
    .map(mapElement, {
      zoomControl: false,
      worldCopyJump: true,
    })
    .setView([23, 4], 2);

  leaflet.control
    .zoom({
      position: "bottomright",
    })
    .addTo(map);

  leaflet
    .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    })
    .addTo(map);

  return map;
}

export function removeActiveMap(activeMap) {
  if (!activeMap) return null;
  activeMap.remove();
  return null;
}

export function getPopupMaxWidth(windowRef) {
  if (!windowRef) return 280;
  return Math.min(280, Math.max(196, windowRef.innerWidth - 68));
}

export function getPopupPanPadding(leaflet, windowRef) {
  const padding = windowRef && windowRef.innerWidth <= 520 ? 14 : 22;
  return leaflet.point(padding, padding);
}

export function createMarkerIcon(leaflet, placeType, selected = false, offset = [0, 0]) {
  return leaflet.divIcon({
    className: "",
    html: `<span class="about-map-marker about-map-marker--${placeType}${selected ? " is-selected" : ""}"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12 - offset[0], 12 - offset[1]],
    popupAnchor: [0, -15],
  });
}

export function createPopupMarkup(place) {
  return `<div class="about-map-popup">
    <img src="${place.image}" alt="Photo placeholder for ${place.title}" loading="lazy" />
    <div>
      <p class="about-map-popup__tag">${getPlaceTypeLabel(place.type)}</p>
      <h3>${place.title}</h3>
      <p>${place.location}</p>
      ${place.type !== "travel" && place.period ? `<p>${place.period}</p>` : ""}
      ${place.type !== "travel" ? `<p>${place.description}</p>` : ""}
      ${place.link ? `<p><a href="${place.link}" target="_blank" rel="noopener noreferrer">Airbus Geo Explore Early Testing Programme</a></p>` : ""}
    </div>
  </div>`;
}

export function createAboutMapSession({
  leaflet,
  windowRef = globalThis.window,
  setTimeoutFn = globalThis.setTimeout,
  clearTimeoutFn = globalThis.clearTimeout,
} = {}) {
  if (!leaflet) {
    throw new TypeError("The About map session requires a Leaflet adapter");
  }

  const popupMaxWidth = () => getPopupMaxWidth(windowRef);
  const popupPanPadding = () => getPopupPanPadding(leaflet, windowRef);
  const markerIcon = (placeType, selected, offset) =>
    createMarkerIcon(leaflet, placeType, selected, offset);
  const popupMarkup = (place) => createPopupMarkup(place);

  const mount = (root, signal) => {
    if (!root || !signal) return false;

    const elements = getMapMountElements(root);

    if (!canMountMap(elements)) return false;

    resetLeafletContainer(elements.mapElement);

    const updateCardsNav = bindCardsNavigation({
      root,
      cardsViewport: elements.cardsViewport,
      cardsPrev: elements.cardsPrev,
      cardsNext: elements.cardsNext,
      signal,
      windowRef,
    });

    const scheduleTimeout = (callback, delay) => {
      const timeoutId = setTimeoutFn(callback, delay);
      signal.addEventListener("abort", () => clearTimeoutFn(timeoutId));
      return timeoutId;
    };

    let activeMap = null;
    const removeMap = () => {
      activeMap = removeActiveMap(activeMap);
    };

    signal.addEventListener("abort", removeMap);

    try {
      const map = initializeLeafletMap(leaflet, elements.mapElement);
      activeMap = map;

      createMapRuntime({
        leaflet,
        map,
        mapElement: elements.mapElement,
        root,
        mapPlaces: elements.mapPlaces,
        filterButtons: elements.filterButtons,
        cardButtons: elements.cardButtons,
        cardsViewport: elements.cardsViewport,
        signal,
        windowRef,
        clearTimeoutFn,
        scheduleTimeout,
        markerIcon,
        popupMarkup,
        popupMaxWidth,
        popupPanPadding,
        updateCardsNav,
      });

      return true;
    } catch (error) {
      removeMap();
      signal.removeEventListener("abort", removeMap);
      throw error;
    }
  };

  return { mount };
}
