import React from 'react'
import Radium from 'radium'
import Console from './console.jsx'
import Field from './field.jsx'
import MissionData from './mission_data.js'
import MissionStyle from './mission_style.js'

class Mission extends React.Component {
  static get STATUS() {
    return {
      ONGOING: 0,
      FAILED: 1,
      COMPLETE: 2
    }
  }

  // TODO JSON APIサーバーを実装してそこから読み込むようにする
  static getDataFromServer(params) {
    return new MissionData(params).build().map(grid => {
      grid.isRevealed = false
      return grid
    })
  }

  constructor(props) {
    super(props)

    this.state = {
      data: [],
      params: { nRow: 5, nCol: 5, nMine: 5 },
      status: this.constructor.STATUS.ONGOING
    }
  }

  componentDidMount() {
    let nextData = this.constructor.getDataFromServer(this.state.params)
    this.setState({ data: nextData })
  }

  componentDidUpdate() {
    if(this.state.status === this.constructor.STATUS.COMPLETE) {
      alert('Mission Complete!')
    } else if(this.state.status === this.constructor.STATUS.FAILED) {
      alert('Mission Failed!')
    } else if(this.isComplete()) {
      this.setState({ status: this.constructor.STATUS.COMPLETE })
    }
  }

  findGridById(gridId) {
    return this.state.data.filter(grid => grid.id === gridId).shift()
  }

  handleRevealing(gridId) {
    let grid = this.findGridById(gridId)

    if(grid.isMined) {
      this.revealAllMinedGrids()
      this.setState({ status: this.constructor.STATUS.FAILED })
    } else {
      this.revealGridsRecursivelyFrom(grid)
    }
  }

  handleParamsChange(nextParams) {
    let nextData = this.constructor.getDataFromServer(nextParams)

    this.setState({
      data: nextData,
      params: nextParams,
      status: this.constructor.STATUS.ONGOING
    })
  }

  isComplete() {
    return (
      this.state.data.every(grid => {
        return grid.isRevealed && !grid.isMined || !grid.isRevealed && grid.isMined
      })
    )
  }

  revealAllMinedGrids() {
    let nextData = this.state.data.map(grid => {
      if(grid.isMined) grid.isRevealed = true
      return grid
    })

    this.setState({ data: nextData })
  }

  revealGridsRecursivelyFrom(sourceGrid) {
    let targetGridIds = this.searchSafeGridIdsRecursivelyFrom(sourceGrid)

    let nextData = this.state.data.map(grid => {
      if(targetGridIds.has(grid.id)) grid.isRevealed = true
      return grid
    })

    this.setState({ data: nextData })
  }

  // TODO 見通し悪すぎなのでリファクタリングする
  searchSafeGridIdsRecursivelyFrom(sourceGrid, context = {}) {
    if(sourceGrid.isMined) return new Set()

    if(context.safeGridIds && context.searchedGridIds) {
      context.safeGridIds.add(sourceGrid.id)
      context.searchedGridIds.add(sourceGrid.id)
    } else {
      context.safeGridIds = new Set([sourceGrid.id])
      context.searchedGridIds = new Set([sourceGrid.id])
    }

    if(sourceGrid.number === 0) {
      sourceGrid.adjacentIds.forEach(gridId => {
        if(context.searchedGridIds.has(gridId)) return
        let grid = this.findGridById(gridId)

        if(grid.isMined) {
          context.searchedGridIds.add(grid.id)
        } else {
          this.searchSafeGridIdsRecursivelyFrom(grid, context)
        }
      })
    }

    return context.safeGridIds
  }

  render() {
    return (
      <div style={MissionStyle.base}>
        <Console
          onParamsChange={this.handleParamsChange.bind(this)}
          params={this.state.params}
        />
        <Field
          data={this.state.data}
          shape={[this.state.params.nRow, this.state.params.nCol]}
          isMutable={this.state.status === this.constructor.STATUS.ONGOING}
          onRevealing={this.handleRevealing.bind(this)}
        />
      </div>
    )
  }
}

export default Radium(Mission)
