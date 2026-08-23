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

export function getMarkerOffsets(mapPlaces, proximity = 2.5) {
  const groups = [];

  mapPlaces.forEach((place) => {
    const group = groups.find((candidate) =>
      candidate.some(
        (member) => Math.hypot(member.lat - place.lat, member.lng - place.lng) <= proximity
      )
    );

    if (group) {
      group.push(place);
    } else {
      groups.push([place]);
    }
  });

  return new Map(
    groups
      .filter((group) => group.length > 1)
      .flatMap((group) =>
        group.map((place, index) => [place.id, [(index - (group.length - 1) / 2) * 36, 0]])
      )
  );
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
  markerOffsets = new Map(),
}) {
  mapPlaces.forEach((place) => {
    const marker = markersById.get(place.id);
    if (!marker) return;
    marker.setIcon(markerIcon(place.type, place.id === placeId, markerOffsets.get(place.id)));
  });
  cardButtons.forEach((card) => {
    const isSelected = card.dataset.placeId === placeId;
    card.dataset.active = isSelected ? "true" : "false";
    card.setAttribute?.("aria-pressed", isSelected ? "true" : "false");
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

export function createMapInteractionCoordinator({
  map: { leaflet, instance: map, element: mapElement },
  places: mapPlaces,
  ui: { root, filterButtons, cardButtons, cardsViewport },
  environment: { windowRef },
  lifecycle: { signal, clearTimeoutFn, scheduleTimeout },
  presentation: { markerIcon, popupMarkup, popupMaxWidth, popupPanPadding },
  updateCardsNav,
}) {
  const markersById = new Map();
  let activeFilter = "all";
  let activePlaceId = null;
  const markerOffsets = getMarkerOffsets(mapPlaces);

  const highlight = (placeId) => {
    activePlaceId = highlightMapSelection({
      placeId,
      mapPlaces,
      markersById,
      cardButtons,
      markerIcon,
      markerOffsets,
    });
  };

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
        card.setAttribute?.("aria-pressed", "false");
      });
    }
  };

  const createMarkers = () => {
    mapPlaces.forEach((place) => {
      const marker = leaflet
        .marker([place.lat, place.lng], {
          icon: markerIcon(place.type, false, markerOffsets.get(place.id)),
          keyboard: false,
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
  };

  const bindFilterButtons = () => {
    filterButtons.forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const filter = button.dataset.filter;
          if (!filter) return;
          activeFilter = filter;
          filterButtons.forEach((filterButton) => {
            const isSelected = filterButton === button;
            filterButton.dataset.active = isSelected ? "true" : "false";
            filterButton.setAttribute?.("aria-pressed", isSelected ? "true" : "false");
          });
          updateVisibility();
        },
        { signal }
      );
    });
  };

  const bindCardButtons = () => {
    cardButtons.forEach((card) => {
      card.addEventListener(
        "click",
        () => {
          const selection = getCardSelection(card, mapPlaces, markersById);
          if (!selection) return;

          const { marker, place, placeId } = selection;
          highlight(placeId);

          const targetZoom = Math.max(map.getZoom(), 4);
          const targetCenter = getCardSelectionCenter(
            map,
            mapElement,
            windowRef,
            place,
            targetZoom
          );

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
  };

  const start = () => {
    createMarkers();
    bindFilterButtons();
    bindCardButtons();
    updateVisibility();

    scheduleTimeout(() => {
      map.invalidateSize();
      updateCardsNav();
    }, 80);

    scheduleTimeout(() => {
      map.invalidateSize();
    }, 400);
  };

  return { start };
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
  const coordinator = createMapInteractionCoordinator({
    map: { leaflet, instance: map, element: mapElement },
    places: mapPlaces,
    ui: { root, filterButtons, cardButtons, cardsViewport },
    environment: { windowRef },
    lifecycle: { signal, clearTimeoutFn, scheduleTimeout },
    presentation: { markerIcon, popupMarkup, popupMaxWidth, popupPanPadding },
    updateCardsNav,
  });

  coordinator.start();
}
