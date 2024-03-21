import { defineStore } from 'pinia'

export const networkStore = defineStore('networkStore', {
  state: () => ({
    networkError: '200',
  }),

  getters: {
    gettersArrow: () => {
      console.log('gettersArrow this :>> ', this)
      return this
    },
    gettersFunc() {
      console.log('function this :>> ', this.networkError)
      return this
    },
  },

  actions: {
    actionsFunc() {
      console.log('actionsFunc this :>> ', this)
      return this
    },

    actionsArrow: () => {
      console.log('actionsArrow this :>> ', this)
      return this
    },
  },
})()
