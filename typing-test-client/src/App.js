var React = require('react');
require('./sass/app.scss');
require('./font-awesome/css/font-awesome.css');

class TextDisplay extends React.Component {
  constructor(props) {
    super();

  }
  _getCompletedText = () => {
    if (this.props.lineView) {
      return '';
    }
    return this.props.children.slice(0, this.props.index);
  }

  _getCurrentText = () => {
    var idx = this.props.index;
    var text = this.props.children;
    if (text.slice(idx).indexOf(' ') === -1) {
      return text.slice(idx);
    }
    return text.slice(idx, idx + text.slice(idx).indexOf(' '));
  }

  _getRemainingText = () => {
    var idx = this.props.index;
    var text = this.props.children;
    if (text.slice(idx).indexOf(' ') === -1) {
      return '';
    }
    var wordEnd = idx + text.slice(idx).indexOf(' ');
    if (this.props.lineView) {
      return text.slice(wordEnd).split(' ').slice(0, 5).join(' ');
    }
    return text.slice(wordEnd);
  }
  render() {
    return (
      <div className={this.props.lineView ? "textDisplay lg" : "textDisplay"}>
        {this._getCompletedText()}
        <span className={this.props.error ? "error" : "success"}>
          {this._getCurrentText()}
        </span>
        {this._getRemainingText()}
      </div>
    );
  }
};

class Clock extends React.Component {
  constructor(props) {
    super()

  };
  render() {
    var elapsed = Math.round(this.props.elapsed / 100);
    var timer = elapsed / 10 + (elapsed % 10 ? '' : '.0');
    return (
      <span className="timer">
        {timer}
      </span>
    );
  }
};


class TextInput extends React.Component {
  constructor(props) {
    super(props)

  };

  handleChange = (e) => {
    if (!this.props.started) {
      this.props.setupIntervals();
    }
    this.props.onInputChange(e);
  }

  render() {
    return (
      <div className="textInput">
        <input
          type="text"
          placeholder="Start typing.."
          className={this.props.error ? 'error' : ''}
          ref="textInput"
          value={this.props.value}
          onChange={this.handleChange} />
      </div>
    );
  }
};

function TopScores(props) {
  return (
    <div style={{ margin: "55px 0" }}>
      <h2>Top Scores</h2>
      {props.scores.map((score, index) => {
        return (
          <li> {index + 1}# {score.wpm} </li>
        )
      })}
    </div>
  )
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      index: 0,
      error: false,
      errorCount: 0,
      lineView: false,
      timeElapsed: 0,
      value: '',
      startTime: null,
      wpm: 0,
      excerpt: '',
      completed: false,
      scores: []
    }
  }
  componentDidMount() {
    this.intervals = [];
    this.fetchExcerpts()
  }

  async fetchExcerpts() {
    const response = await fetch('http://127.0.0.1:5000/excerpts')
    const data = await response.json()
    const item = data.excerpt
    console.log(data, '====================')
    this.setState({
      excerpt: item.body,
      excerptId: item.id,
      scores: item.scores.top_scores
    })
  }

  setInterval() {
    this.intervals.push(setInterval.apply(null, arguments));
  }

  async _postScore(wpm, elapsed) {
    const score = {
      wpm: wpm,
      errors: this.state.errorCount,
      time: elapsed,
      id: this.state.excerptId
    }

    const response = await fetch('http://127.0.0.1:5000/post-score', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(score)
    });

    const content = await response.json();
    console.log(content);
    this.setState({
      ranking: content.ranking,
      total_attempts: content.total_attempts,
      scores: content.top_scores
    })
  }

  _randomElement = array => {
    return array[Math.floor(Math.random() * array.length)];
  }

  _handleInputChange = e => {
    if (this.state.completed) {
      return;
    }
    var inputVal = e.target.value;
    var index = this.state.index;
    if (this.state.excerpt.slice(index, index + inputVal.length) === inputVal) {
      if (inputVal.slice(-1) === " " && !this.state.error) {
        // handle a space after a correct word
        this.setState({
          index: this.state.index + inputVal.length,
          value: ''
        });
      }
      else if (index + inputVal.length === this.state.excerpt.length) {
        // successfully completed
        this.setState({
          value: '',
          completed: true
        }, function () {
          this._calculateWPM();
        });
        this.intervals.map(clearInterval);
      }
      else {
        this.setState({
          error: false,
          value: inputVal
        });
      }
    } else {
      this.setState({
        error: true,
        value: inputVal,
        errorCount: this.state.error ? this.state.errorCount : this.state.errorCount + 1
      });
    }
  }

  _changeView = e => {
    this.setState({ lineView: !this.state.lineView });
  }

  _restartGame = () => {
    // preserve lineView
    // var newState = this.state;
    // newState.lineView = this.state.lineView;
    this.setState({
      index: 0,
      error: false,
      errorCount: 0,
      lineView: false,
      timeElapsed: 0,
      value: '',
      startTime: null,
      wpm: 0,
      completed: false
    }, () => this.intervals.map(clearInterval));
    this.fetchExcerpts()
  }

  _setupIntervals = () => {
    this.setState({
      startTime: new Date().getTime(),
    }, () => {
      // timer
      this.setInterval(() => {
        this.setState({
          timeElapsed: new Date().getTime() - this.state.startTime
        });
      }, 50);
      // WPM
      this.setInterval(() => {
        this._calculateWPM();
      }, 1000)
    });
  }

  _calculateWPM = () => {
    var elapsed = new Date().getTime() - this.state.startTime;
    var wpm;
    if (this.state.completed) {
      wpm = this.state.excerpt.split(' ').length / (elapsed / 1000) * 60;
      this._postScore(wpm, elapsed);
    } else {
      var words = this.state.excerpt.slice(0, this.state.index).split(' ').length;
      wpm = words / (elapsed / 1000) * 60;
    }
    this.setState({
      wpm: this.state.completed ? Math.round(wpm * 10) / 10 : Math.round(wpm)
    });
  }

  render() {
    return (
      <div>
        <div className="header">
          <h1>Type Racing</h1>
          <i
            className="fa fa-lg fa-refresh"
            onClick={() => this._restartGame()}>
          </i>
          <i
            className="fa fa-lg fa-bars"
            onClick={this._changeView}>
          </i>
        </div>
        <TopScores scores={this.state.scores} />
        <TextDisplay
          index={this.state.index}
          error={this.state.error}
          lineView={this.state.lineView}>
          {this.state.excerpt}
        </TextDisplay>
        {this.state.completed ? <p style={{ margin: "50px 0", color: 'limegreen' }}>
          Congratulations! {this.state.wpm} WPM is the #{this.state.ranking} best score out of {this.state.total_attempts}
        </p> : null
        }
        <TextInput
          onInputChange={this._handleInputChange}
          setupIntervals={this._setupIntervals}
          value={this.state.value}
          started={!!this.state.startTime}
          error={this.state.error} />
        <div className={this.state.completed ? "stats completed" : "stats"} >
          <Clock elapsed={this.state.timeElapsed} />
          <span className="wpm">{this.state.wpm}</span>
          <span className="errors">{this.state.errorCount}</span>
        </div>
        <Footer />
      </div>
    );
  }
};

class Footer extends React.Component {
  render() {
    return (
      <div className="footer">
        Source code available on <a target="_blank" href="https://github.com/sinapinto/react-typing-test">Github</a>.
        Colorscheme used is <a target="_blank" href="https://github.com/morhetz/gruvbox">Gruvbox</a>.
        Retouch by <a target="_blank" href="https://github.com/kyakaze/react_typing_test_retouch"> kyakaze :) </a>
      </div>
    );
  }
};

export default App;