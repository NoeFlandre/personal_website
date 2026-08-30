const canvasStyle = {
  background: "#fefbfb",
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const backgroundPanelStyle = {
  position: "absolute",
  top: "-1px",
  right: "-1px",
  border: "4px solid #000",
  background: "#ecebeb",
  opacity: "0.9",
  borderRadius: "4px",
  display: "flex",
  justifyContent: "center",
  margin: "2.5rem",
  width: "88%",
  height: "80%",
};

const foregroundPanelStyle = {
  border: "4px solid #000",
  background: "#fefbfb",
  borderRadius: "4px",
  display: "flex",
  justifyContent: "center",
  margin: "2rem",
  width: "88%",
  height: "80%",
};

const contentContainerStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  margin: "20px",
  width: "90%",
  height: "90%",
};

export function createOgFrame(children) {
  return {
    type: "div",
    props: {
      style: canvasStyle,
      children: [
        { type: "div", props: { style: backgroundPanelStyle } },
        {
          type: "div",
          props: {
            style: foregroundPanelStyle,
            children: {
              type: "div",
              props: {
                style: contentContainerStyle,
                children,
              },
            },
          },
        },
      ],
    },
  };
}

export function createOgRenderOptions(fonts) {
  return {
    width: 1200,
    height: 630,
    embedFont: true,
    fonts,
  };
}
