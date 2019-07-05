const VisUtil = {
  removeSvg: (selector) => {
    d3.selectAll(`${selector} > *`).remove();
  },
  removeSvgs: (selectors) => {
    for (let selector of selectors) {
      removeSvg(selector);
    }
  },
}
