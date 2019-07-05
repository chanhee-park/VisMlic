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
        'alignment-baseline': _.isNil(attrs.baseline) ? 'hanging' : attrs.baseline,
        'fill': _.isNil(attrs.fill) ? '#555' : attrs.fill,
      })
      .style("font-size", _.isNil(attrs.size) ? '20px' : attrs.size);
  }
}
