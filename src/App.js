import React from 'react';
import PropTypes from 'prop-types';
        
class App extends React.Component {
  constructor() {
    super();
    this.state = {
      directories: [],
      directory: '',
      files: [],
      message: ''
    };

    this.handleForm = this.handleForm.bind(this);
  }

  componentDidMount() {
    this.loadDirectories();
  }
  
  loadDirectories() {
    fetch(`/api/`).then(response => {
      if (response.ok) {
        response.json()
        .then(data => {
          console.log({data});
          this.setState({
            directories: data.directories
          });
        });
      } else {
        response.json().then(err => {
          console.log('Failed to fetch directories: ' + err.message);
        });
      }
    })
    .catch(err => {
      console.log('Error in fetching data from server:', err);
    });
  }

  fetchDirectory(dir) {
    const directory = { dir };
    console.log({directory})
    fetch(`/api/path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(directory)
    }).then(response => {
      if (response.ok && response.status === 200) {
        response.json().then(data => {
          console.log({data});
          if(data.files.length !== 0) {
            this.setState({
              files: data.files,
              message: data.message
            });
          }else {
            this.setState({
              files: [],
              message: data.message
            });
          }
        });
      }else {
        response.json().then(err => {
          console.log('Failed to fetch data from directory: ' + err.message);
          this.setState({
            message: err.message
          });
        }).catch(err => {
          console.log({err})
        });
      }
    }).catch(err => {
      console.log('Failed to fetch data from server');
    });
  }

  handleForm(e) {
    e.preventDefault();
    const { path: { value }} = e.target;

    if( value !== '') {
      this.fetchDirectory(value);
      e.target.reset();

      this.setState({
        directory: value
      });
    } 
  }

  renderFS() {
    const { directories } = this.state;
    const items = directories.map(item => <li key={item}>{item}</li> );

    return <ul>{items}</ul>;
  }

  renderTextFiles() {
    const { files } = this.state;

    if( files.length === 0 ) return null;

    const textFiles = files.map((f, index) => {
      return (
        <li key={index} className="list-group-item">
          <strong>File: </strong> {f.file}
          <br />
          <strong>Words: </strong> {f.wordCount}
        </li>
      )
    });

    return <ul className="list-group">{ textFiles }</ul>
  }

  render() {
    const { directory, message } = this.state;
    const textFiles = this.renderTextFiles();
    const fs = this.renderFS();
    return (
      <div className="app">
        <div className="alert alert-info">
          <h1>Maana File System Reading App</h1>
        </div>

        <div className="container">
          <div className="row">
            <div className="col">

              <div className="card text-white bg-dark mb-3">
                <div className="card-header">Available directories on the server</div>
                <div className="card-body">
                  <div className="card-text">
                    { fs }
                  </div>
                </div>
              </div>
              
              <form onSubmit={this.handleForm}>
                <label>
                  Type a folder to inspect its elements <br />
                  <small>You can also inspect other folders: /Users/myUser/Dcouments</small>
                </label>
                <br />
                <input 
                  type="text" 
                  name="path" 
                  placeholder="path/to/inspect" 
                  className="form-control mb-2" />
                <button type="submit" className="btn btn-primary">Inspect directory</button>
              </form>

            </div>
            <div className="col">

              <div className="card bg-light mb-3">
                <div className="card-header">Selected Directory: { directory }</div>
                <div className="card-body">
                  <div className="card-text">
                    { message !== '' ? (<p className="alert alert-danger">{message}</p>): null }
                    { textFiles }
                  </div>
                </div>
              </div>
            
            </div>
          </div> { /* .row */}
        </div> { /* .container */}

      </div>
    );
  }
}

App.propTypes = {
  location: PropTypes.objectOf(PropTypes.object),
  history: PropTypes.objectOf(PropTypes.object)
}

App.defaultProps = {
  location: {},
  history: {}
}
  
export default App;
