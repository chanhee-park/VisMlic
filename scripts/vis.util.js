const VisUtil = {
  emptySvg: (selector) => {
    d3.selectAll(`${selector} > *`).remove();
  },
  emptySvgs: (selectors) => {
    for (let selector of selectors) {
      emptySvg(selector);
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
        'writing-mode': _.isNil(attrs['writing-mode']) ? 'horizontal-tb' : attrs['writing-mode'],
        'word-spacing': _.isNil(attrs['writing-mode']) ? '1' : '15',
        'letter-spacing': _.isNil(attrs['writing-mode']) ? '1' : '1.5',

      })
      .style("font-size", _.isNil(attrs.size) ? '20px' : attrs.size)
      .classed(attrs.class, !_.isNil(attrs.class));
  },
  line: (svg, attrs) => {
    svg.append('line')
      .attrs({
        x1: _.isNil(attrs.x1) ? 100 : attrs.x1,
        x2: _.isNil(attrs.x2) ? 200 : attrs.x2,
        y1: _.isNil(attrs.y1) ? 100 : attrs.y1,
        y2: _.isNil(attrs.y2) ? 200 : attrs.y2,
        stroke: _.isNil(attrs.stroke) ? '#ccc' : attrs.stroke,
        'stroke-width': _.isNil(attrs.width) ? '#ccc' : attrs.width,
        'stroke-opacity': _.isNil(attrs.opacity) ? 1 : attrs.opacity,
      })
      .classed(attrs.class, !_.isNil(attrs.class));
  },
  path: (svg, pathData, attrs) => {
    const lineBasis = d3.line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveMonotoneX); // curveLinear or curveMonotoneX

    svg.append('path')
      .attr('d', lineBasis(pathData))
      .attrs({
        fill: 'none',
        stroke: _.isNil(attrs.stroke) ? '#ccc' : attrs.stroke,
        'stroke-width': _.isNil(attrs.width) ? ' 5px' : attrs.width,
      })
      .classed(attrs.class, !_.isNil(attrs.class));
  },
  rect: (svg, attrs) => {
    svg.append('rect')
      .attrs({
        x: _.isNil(attrs.x) ? 0 : attrs.x,
        y: _.isNil(attrs.y) ? 0 : attrs.y,
        width: _.isNil(attrs.w) ? 100 : attrs.w,
        height: _.isNil(attrs.h) ? 100 : attrs.h,
        fill: _.isNil(attrs.fill) ? '#ccc' : attrs.fill,
        stroke: _.isNil(attrs.stroke) ? '#ccc' : attrs.stroke,
        'stroke-width': _.isNil(attrs.st_width) ? '0px' : attrs.st_width,
      })
      .classed(attrs.class, !_.isNil(attrs.class));
  },
  circle: (svg, attrs) => {
    svg.append('circle')
      .attrs({
        cx: _.isNil(attrs.x) ? 10 : attrs.x,
        cy: _.isNil(attrs.y) ? 10 : attrs.y,
        r: _.isNil(attrs.r) ? 20 : attrs.r,
        fill: _.isNil(attrs.fill) ? '#fff' : attrs.fill,
        stroke: _.isNil(attrs.stroke) ? '#ccc' : attrs.stroke,
        'stroke-width': _.isNil(attrs.st_width) ? '3px' : attrs.st_width,
      })
      .classed(attrs.class, !_.isNil(attrs.class));
  },
  image: (svg, file, attrs) => {
    svg.append('image')
      .attrs({
        "xlink:href": file,
        x: _.isNil(attrs.x) ? 10 : attrs.x,
        y: _.isNil(attrs.y) ? 10 : attrs.y,
        width: _.isNil(attrs.w) ? 10 : attrs.w,
        height: _.isNil(attrs.h) ? 10 : attrs.h,
        opacity: _.isNil(attrs.opacity) ? 1 : attrs.opacity,
      })
      .classed(attrs.class, !_.isNil(attrs.class));
  },
  /**
   * svg 하위 객체를 selectors 순으로 z축 정렬한다.
   * @param svg: 정렬한 svg 상위 객체. 이 객체 하위에 있는 객체들이 정렬된다.
   * @param selectors: 정렬할 순서로 저장되어 있는 선택자 배열.
   */
  sortSvgObjs: (svg, selectors) => {
    _.forEach(selectors, (selector) => svg.selectAll(selector).raise());
  }
}
