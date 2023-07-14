const LABELS = ["b", "k", "n", "p", "q", "r", "B", "K", "N", "P", "Q", "R"]

export const renderBoxes = (canvasRef, bbox_conf_cls, fps) => {
  const ctx = canvasRef.getContext("2d");
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // clean canvas

  const colors = new Colors();

  // font configs
  const font = `${Math.max(Math.round(Math.max(ctx.canvas.width, ctx.canvas.height) / 40), 14)}px Arial`;
  ctx.font = font;
  ctx.textBaseline = "top";
  ctx.lineWidth = Math.max(Math.min(ctx.canvas.width, ctx.canvas.height) / 200, 2.5);
  const textHeight = parseInt(font, 10);

  // fps box
  const text = `FPS:${fps}`;
  const textWidth = ctx.measureText(text).width;
  ctx.fillStyle = "#333333"
  ctx.fillRect(0, 0, textWidth + ctx.lineWidth, textHeight + ctx.lineWidth);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, 0, 0);

  for (let i = 0; i < bbox_conf_cls.length; ++i) {
    let [x1, y1, x2, y2, conf, cls, square] = bbox_conf_cls[i];
    // filter based on class threshold
    const klass = LABELS[cls];
    const color = colors.get(cls);
    const width = x2 - x1;
    const height = y2 - y1;

    // draw box.
    ctx.fillStyle = Colors.hexToRgba(color, 0.2);
    ctx.fillRect(x1, y1, width, height);

    // draw border box.
    ctx.strokeStyle = color;
    ctx.strokeRect(x1, y1, width, height);

    // Draw the label background.
    ctx.fillStyle = color;
    const text = `${klass}${square}`;
    const textWidth = ctx.measureText(text).width;
    const yText = y1 - (textHeight + ctx.lineWidth);
    ctx.fillRect(
      x1 - 1,
      yText < 0 ? 0 : yText, // handle overflow label box
      textWidth + ctx.lineWidth,
      textHeight + ctx.lineWidth
    );

    // Draw labels
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, x1 - 1, yText < 0 ? 0 : yText);
  }
};

class Colors {
  constructor() {
    this.palette = [
      "#FF3838",
      "#FF9D97",
      "#FF701F",
      "#FFB21D",
      "#CFD231",
      "#48F90A",
      "#92CC17",
      "#3DDB86",
      "#1A9334",
      "#00D4BB",
      "#2C99A8",
      "#00C2FF",
      "#344593",
      "#6473FF",
      "#0018EC",
      "#8438FF",
      "#520085",
      "#CB38FF",
      "#FF95C8",
      "#FF37C7",
    ];
    this.n = this.palette.length;
  }

  get = (i) => this.palette[Math.floor(i) % this.n];

  static hexToRgba = (hex, alpha) => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `rgba(${[parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)].join(
          ", "
        )}, ${alpha})`
      : null;
  };
}
