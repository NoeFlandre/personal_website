const DEFAULT_PLACES = [
  {
    id: "work-place",
    type: "work",
    lat: 48,
    lng: 2,
    image: "/work.jpg",
    title: "Work",
    location: "Paris",
  },
  {
    id: "travel-place",
    type: "travel",
    lat: 28,
    lng: 77,
    image: "/travel.jpg",
    title: "Travel",
    location: "Delhi",
  },
];

export class FakeElement extends EventTarget {
  constructor(dataset = {}) {
    super();
    this.dataset = { ...dataset };
    this.attributes = [];
    const classes = new Set();
    this.classList = {
      add: (name) => classes.add(name),
      contains: (name) => classes.has(name),
      remove: (name) => classes.delete(name),
    };
    this.clientHeight = 300;
    this.clientWidth = 300;
    this.scrollWidth = 600;
    this.scrollLeft = 0;
    this.scrollByCalls = [];
    this.scrollIntoViewCalls = [];
    this.scrollCalls = this.scrollIntoViewCalls;
  }

  hasClass(name) {
    return this.classList.contains(name);
  }

  setAttribute(name, value) {
    this.attributes.push([name, value]);
  }

  scrollBy(options) {
    this.scrollByCalls.push(options);
    this.scrollLeft += options.left;
  }

  scrollIntoView(options) {
    this.scrollIntoViewCalls.push(options);
  }
}

export class FakeButton extends FakeElement {
  constructor(dataset = {}) {
    super(dataset);
    this.disabled = false;
  }
}

export class FakeRoot extends FakeElement {
  constructor(places, { filterValues = ["all", "work", "travel"] } = {}) {
    super({ places: JSON.stringify(places) });
    this.mapElement = new FakeElement();
    this.filterButtons = filterValues.map((filter) => new FakeButton({ filter }));
    this.cardButtons = places.map(
      (place) =>
        new FakeButton({
          placeId: place.id,
          placeType: place.type,
          hidden: "false",
        })
    );
    this.cardsViewport = new FakeElement();
    this.cardsPrev = new FakeButton();
    this.cardsNext = new FakeButton();
  }

  querySelector(selector) {
    if (selector === "[data-map-canvas]") return this.mapElement;
    if (selector === "[data-cards-viewport]") return this.cardsViewport;
    if (selector === "[data-cards-prev]") return this.cardsPrev;
    if (selector === "[data-cards-next]") return this.cardsNext;
    const placeMatch = selector.match(/^\[data-place-id="(.+)"\]$/);
    if (placeMatch) {
      return this.cardButtons.find((card) => card.dataset.placeId === placeMatch[1]) ?? null;
    }
    return null;
  }

  querySelectorAll(selector) {
    if (selector === "[data-filter]") return this.filterButtons;
    if (selector === "[data-place-id]") return this.cardButtons;
    return [];
  }
}

export class FakeDocument extends EventTarget {
  constructor(root) {
    super();
    this.readyState = "complete";
    this.roots = [root];
  }

  querySelectorAll(selector) {
    return selector === "[data-about-map-root]" ? this.roots : [];
  }
}

export class FakeWindow extends EventTarget {
  constructor(innerWidth = 1024) {
    super();
    this.innerWidth = innerWidth;
  }
}

export class FakeMap {
  constructor({ zoom = 4, centerDistance = 0 } = {}) {
    this.layers = new Set();
    this.fitBoundsCalls = [];
    this.invalidated = 0;
    this.invalidatedSizes = 0;
    this.removed = false;
    this.zoom = zoom;
    this.centerDistance = centerDistance;
    this.events = new Map();
    this.moveEvents = this.events;
    this.flyToCalls = [];
    this.projectOffsets = [];
  }

  setView() {
    return this;
  }

  addLayer(layer) {
    this.layers.add(layer);
    return this;
  }

  removeLayer(layer) {
    this.layers.delete(layer);
    return this;
  }

  hasLayer(layer) {
    return this.layers.has(layer);
  }

  fitBounds(bounds, options) {
    this.fitBoundsCalls.push({ bounds, options });
  }

  getZoom() {
    return this.zoom;
  }

  getCenter() {
    return { distanceTo: () => this.centerDistance };
  }

  project() {
    return {
      subtract: (offset) => {
        this.projectOffsets.push(offset);
        return { lat: 0, lng: 0, distanceTo: () => 0 };
      },
    };
  }

  unproject(center) {
    return center;
  }

  stop() {}

  closePopup() {}

  flyTo(center, zoom, options) {
    this.flyToCalls.push({ center, zoom, options });
    return this;
  }

  invalidateSize() {
    this.invalidated += 1;
    this.invalidatedSizes = this.invalidated;
  }

  once(event, callback) {
    this.events.set(event, callback);
  }

  off(event, callback) {
    if (this.events.get(event) === callback) this.events.delete(event);
  }

  remove() {
    this.removed = true;
  }
}

export class FakeMarker {
  constructor(map, coordinates, options) {
    this.map = map;
    this.coordinates = coordinates;
    this.options = options;
    this.markerOptions = options;
    this.popup = { options: { autoPan: true, keepInView: true } };
    this.icon = options.icon;
    this.openedPopups = 0;
    this.openPopupCount = 0;
    this.openPopupSnapshots = [];
    this.events = new Map();
    this.eventHandlers = this.events;
  }

  bindPopup(markup, options) {
    this.popup = {
      markup,
      options: { ...(this.popup?.options ?? {}), ...options },
    };
    return this;
  }

  addTo(map) {
    map.addLayer(this);
    return this;
  }

  on(event, callback) {
    this.events.set(event, callback);
    return this;
  }

  emit(event) {
    this.events.get(event)?.();
  }

  setIcon(icon) {
    this.icon = icon;
    return this;
  }

  getPopup() {
    return this.popup;
  }

  openPopup() {
    this.openedPopups += 1;
    this.openPopupCount += 1;
    this.openPopupSnapshots.push({
      autoPan: this.popup?.options.autoPan,
      keepInView: this.popup?.options.keepInView,
    });
  }
}

export function createLeafletDouble({ mapOptions = {} } = {}) {
  const state = { maps: [], markers: [] };
  const leaflet = {
    state,
    map() {
      const map = new FakeMap(mapOptions);
      state.maps.push(map);
      return map;
    },
    control: {
      zoom: () => ({ addTo: () => undefined }),
    },
    tileLayer: () => ({ addTo: () => undefined }),
    marker(coordinates, options) {
      const marker = new FakeMarker(state.maps.at(-1), coordinates, options);
      state.markers.push(marker);
      return marker;
    },
    divIcon(options) {
      return options;
    },
    point(valueX, valueY) {
      return { x: valueX, y: valueY };
    },
    latLngBounds(positions) {
      return { positions };
    },
  };
  return leaflet;
}

export function createTimers() {
  const timers = new Map();
  let nextId = 1;
  return {
    timers,
    setTimeoutFn(callback, delay) {
      const id = nextId++;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeoutFn(id) {
      timers.delete(id);
    },
  };
}

export function createAboutMapFixture({
  places: configuredPlaces,
  filterValues = ["all", "work", "travel"],
  innerWidth = 1024,
  createMap = false,
  mapOptions = {},
} = {}) {
  const places = (configuredPlaces ?? DEFAULT_PLACES).map((place) => ({ ...place }));
  const root = new FakeRoot(places, { filterValues });
  const documentRef = new FakeDocument(root);
  const windowRef = new FakeWindow(innerWidth);
  const timers = createTimers();
  const leaflet = createLeafletDouble({ mapOptions });
  const map = createMap ? leaflet.map() : null;

  return {
    places,
    root,
    documentRef,
    windowRef,
    timers,
    leaflet,
    map,
    mapElement: root.mapElement,
    filterButtons: root.filterButtons,
    cardButtons: root.cardButtons,
    cardsViewport: root.cardsViewport,
    cardsPrev: root.cardsPrev,
    cardsNext: root.cardsNext,
    markers: leaflet.state.markers,
  };
}
