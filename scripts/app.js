var app = new Vue({
  el: '#app',
  data: {
    title: 'VisMLCV',
    sections: {
      ranking: {
        title: 'Ranking'
      },
      confusion: {
        title: 'Confusion Matrix'
      },
      projection: {
        title: '2D Projection'
      },
      instances: {
        title: 'Instance Analysis'
      },
    }
  }
})
