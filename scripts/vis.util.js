const VisUtil = {
  removeSvg: (selector) => {
    d3.selectAll(`${selector} > *`).remove();
  },
  removeSvgs: (selectors) => {
    for (let selector of selectors) {
      removeSvg(selector);
    }
  },
  text: (svg, str, attrs) => {
    svg.append('text')
      .text(str)
      .attrs({
        x: _.isNil(attrs.x) ? 10 : attrs.x,
        y: _.isNil(attrs.y) ? 10 : attrs.y,
        'text-anchor': _.isNil(attrs.anchor) ? 'middle' : attrs.anchor,
        'alignment-baseline': _.isNil(attrs.baseline) ? 'central' : attrs.baseline,
        'fill': _.isNil(attrs.fill) ? '#555' : attrs.fill,
      })
      .style("font-size", _.isNil(attrs.size) ? '20px' : attrs.size);
  },
  line: (svg, attrs) => {
    svg.append('line')
      .attrs({
        x1: _.isNil(attrs.x1) ? 0 : attrs.x1,
        x2: _.isNil(attrs.x2) ? 0 : attrs.x2,
        y1: _.isNil(attrs.y1) ? 100 : attrs.y1,
        y2: _.isNil(attrs.y2) ? 100 : attrs.y2,
        stroke: _.isNil(attrs.stroke) ? '#ccc' : attrs.stroke,
        'stroke-width': _.isNil(attrs.width) ? '#ccc' : attrs.width,
      });
  },
  rect: (svg, attrs) => {
    svg.append('rect')
      .attrs({
        x: _.isNil(attrs.x) ? 0 : attrs.x,
        y: _.isNil(attrs.y) ? 0 : attrs.y,
        width: _.isNil(attrs.w) ? 100 : attrs.w,
        height: _.isNil(attrs.h) ? 100 : attrs.h,
        fill: _.isNil(attrs.fill) ? '#ccc' : attrs.fill,
      })
  }
}
