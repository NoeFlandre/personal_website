import { getPlaceTypeLabel, parsePlacesDataset } from "../utils/aboutMap.js";

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

export function getCardSelectionOffset(mapHeight, isMobile) {
  const minimum = isMobile ? 72 : 56;
  const maximum = isMobile ? 120 : 96;
  const ratio = isMobile ? 0.24 : 0.18;
  return Math.round(Math.min(maximum, Math.max(minimum, mapHeight * ratio)));
}

export function getCardSelectionCenter(map, mapElement, windowRef, place, targetZoom) {
  const isMobile = (windowRef?.innerWidth ?? 1024) <= 520;
  const mapHeight = mapElement.clientHeight;
  const verticalOffset = getCardSelectionOffset(mapHeight, isMobile);
  const projected = map.project([place.lat, place.lng], targetZoom).subtract([0, verticalOffset]);
  return map.unproject(projected, targetZoom);
}

export function getCardSelection(card, mapPlaces, markersById) {
  const placeId = card.dataset.placeId;
  if (!placeId || card.dataset.hidden === "true") return null;

  const place = mapPlaces.find((item) => item.id === placeId);
  const marker = markersById.get(placeId);
  if (!place || !marker) return null;

  return { marker, place, placeId };
}

export function shouldMoveMap(map, targetCenter, targetZoom) {
  return (
    Math.abs(map.getZoom() - targetZoom) > 0.01 || map.getCenter().distanceTo(targetCenter) > 18
  );
}

export function moveMapToSelection({
  map,
  targetCenter,
  targetZoom,
  revealPopup,
  clearTimeoutFn,
  scheduleTimeout,
}) {
  map.stop();
  map.closePopup();

  let fallbackTimer = null;
  const onMoveEnd = () => {
    if (fallbackTimer) {
      clearTimeoutFn(fallbackTimer);
      fallbackTimer = null;
    }
    revealPopup();
  };

  map.once("moveend", onMoveEnd);
  map.flyTo(targetCenter, targetZoom, { duration: 0.72, easeLinearity: 0.25 });
  fallbackTimer = scheduleTimeout(() => {
    map.off("moveend", onMoveEnd);
    revealPopup();
  }, 900);
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

export function applyPopupViewportOptions(popup, popupMaxWidth, popupPanPadding) {
  if (!popup) return;
  popup.options.maxWidth = popupMaxWidth();
  popup.options.autoPanPaddingTopLeft = popupPanPadding();
  popup.options.autoPanPaddingBottomRight = popupPanPadding();
}

export function openPopupFromCardSelection({ map, marker, popupMaxWidth, popupPanPadding }) {
  if (!map.hasLayer(marker)) return;
  const popup = marker.getPopup();
  if (!popup) {
    marker.openPopup();
    return;
  }

  applyPopupViewportOptions(popup, popupMaxWidth, popupPanPadding);
  const { autoPan, keepInView } = popup.options;
  popup.options.autoPan = false;
  popup.options.keepInView = false;
  marker.openPopup();
  popup.options.autoPan = autoPan;
  popup.options.keepInView = keepInView;
}

export function highlightMapSelection({
  placeId,
  mapPlaces,
  markersById,
  cardButtons,
  markerIcon,
}) {
  mapPlaces.forEach((place) => {
    const marker = markersById.get(place.id);
    if (!marker) return;
    marker.setIcon(markerIcon(place.type, place.id === placeId));
  });
  cardButtons.forEach((card) => {
    card.dataset.active = card.dataset.placeId === placeId ? "true" : "false";
  });

  const activeCard = cardButtons.find((card) => card.dataset.placeId === placeId);
  if (activeCard && activeCard.dataset.hidden !== "true") {
    activeCard.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }

  return placeId;
}

export function updateMapVisibility({
  activeFilter,
  activePlaceId,
  mapPlaces,
  markersById,
  root,
  map,
  leaflet,
  cardsViewport,
  updateCardsNav,
}) {
  const visiblePositions = [];

  mapPlaces.forEach((place) => {
    const isVisible = activeFilter === "all" || place.type === activeFilter;
    const marker = markersById.get(place.id);
    const card = root.querySelector(`[data-place-id="${place.id}"]`);

    if (card) {
      card.dataset.hidden = isVisible ? "false" : "true";
    }

    if (!marker) return;
    if (isVisible) {
      marker.addTo(map);
      visiblePositions.push([place.lat, place.lng]);
    } else {
      map.removeLayer(marker);
    }
  });

  if (visiblePositions.length > 0) {
    const bounds = leaflet.latLngBounds(visiblePositions);
    map.fitBounds(bounds, { padding: [42, 42], maxZoom: 4 });
  }

  if (cardsViewport) {
    cardsViewport.scrollLeft = 0;
  }
  updateCardsNav();

  return mapPlaces.some(
    (place) => place.id === activePlaceId && (activeFilter === "all" || place.type === activeFilter)
  );
}

export function removeActiveMap(activeMap) {
  if (!activeMap) return null;
  activeMap.remove();
  return null;
}

export function createMapRuntime({
  leaflet,
  map,
  mapElement,
  root,
  mapPlaces,
  filterButtons,
  cardButtons,
  cardsViewport,
  signal,
  windowRef,
  clearTimeoutFn,
  scheduleTimeout,
  markerIcon,
  popupMarkup,
  popupMaxWidth,
  popupPanPadding,
  updateCardsNav,
}) {
  const markersById = new Map();
  let activeFilter = "all";
  let activePlaceId = null;

  const highlight = (placeId) => {
    activePlaceId = highlightMapSelection({
      placeId,
      mapPlaces,
      markersById,
      cardButtons,
      markerIcon,
    });
  };

  mapPlaces.forEach((place) => {
    const marker = leaflet
      .marker([place.lat, place.lng], {
        icon: markerIcon(place.type),
        riseOnHover: true,
      })
      .bindPopup(popupMarkup(place), {
        className: "about-map-leaflet-popup",
        maxWidth: popupMaxWidth(),
        keepInView: true,
        autoPanPaddingTopLeft: popupPanPadding(),
        autoPanPaddingBottomRight: popupPanPadding(),
      })
      .addTo(map);

    marker.on("click", () => {
      highlight(place.id);
    });

    marker.on("popupopen", () => {
      highlight(place.id);
    });

    markersById.set(place.id, marker);
  });

  const updateVisibility = () => {
    const selectedStillVisible = updateMapVisibility({
      activeFilter,
      activePlaceId,
      mapPlaces,
      markersById,
      root,
      map,
      leaflet,
      cardsViewport,
      updateCardsNav,
    });
    if (!selectedStillVisible) {
      activePlaceId = null;
      cardButtons.forEach((card) => {
        card.dataset.active = "false";
      });
    }
  };

  filterButtons.forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const filter = button.dataset.filter;
        if (!filter) return;
        activeFilter = filter;
        filterButtons.forEach((filterButton) => {
          filterButton.dataset.active = filterButton === button ? "true" : "false";
        });
        updateVisibility();
      },
      { signal }
    );
  });

  cardButtons.forEach((card) => {
    card.addEventListener(
      "click",
      () => {
        const selection = getCardSelection(card, mapPlaces, markersById);
        if (!selection) return;

        const { marker, place, placeId } = selection;
        highlight(placeId);

        const targetZoom = Math.max(map.getZoom(), 4);
        const targetCenter = getCardSelectionCenter(map, mapElement, windowRef, place, targetZoom);

        const revealPopup = () => {
          if (activePlaceId !== placeId) return;
          openPopupFromCardSelection({
            map,
            marker,
            popupMaxWidth,
            popupPanPadding,
          });
        };

        if (shouldMoveMap(map, targetCenter, targetZoom)) {
          moveMapToSelection({
            map,
            targetCenter,
            targetZoom,
            revealPopup,
            clearTimeoutFn,
            scheduleTimeout,
          });
          return;
        }

        revealPopup();
      },
      { signal }
    );
  });

  updateVisibility();

  scheduleTimeout(() => {
    map.invalidateSize();
    updateCardsNav();
  }, 80);

  scheduleTimeout(() => {
    map.invalidateSize();
  }, 400);
}

export function getPopupMaxWidth(windowRef) {
  if (!windowRef) return 280;
  return Math.min(280, Math.max(196, windowRef.innerWidth - 68));
}

export function getPopupPanPadding(leaflet, windowRef) {
  const padding = windowRef && windowRef.innerWidth <= 520 ? 14 : 22;
  return leaflet.point(padding, padding);
}

export function createMarkerIcon(leaflet, placeType, selected = false) {
  return leaflet.divIcon({
    className: "",
    html: `<span class="about-map-marker about-map-marker--${placeType}${selected ? " is-selected" : ""}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
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
  const markerIcon = (placeType, selected = false) =>
    createMarkerIcon(leaflet, placeType, selected);
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
