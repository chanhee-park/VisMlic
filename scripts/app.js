var app = new Vue({
  el: '#app',
  data: {
    title: 'VisMLCV',
    sections: {
      ranking: {
        title: 'Ranking',
        sort_options: ['recall', 'presicion'],
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
  },
  methods: {
    visualizeRanking: () => {
      console.log('visualize ranking')
    }
  },
  mounted () {
    this.visualizeRanking();
  }
})
