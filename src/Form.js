import React from 'react';

class Form extends React.Component {
  constructor(){
    super();
    this.handleSubmit =  this.handleSubmit.bind(this);
  }


  fetchDirectory(dir) {
    fetch(`/api/${dir}`).then(response => {
      if (response.ok) {
        response.json().then(data => {
          console.log({data});
          this.setState({
            directories: data.directories
          });
        });
      } else {
        response.json().then(err => {
          console.log('Failed to fetch data from directory: ' + err.message);
        });
      }
    }).catch(err => {
      console.log('Failed to fetch data from server');
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    const { path: { value }} = e.target;
    console.log({value})

    if( value !== '') {
      this.fetchDirectory(value);
      e.target.reset();
    } 
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>Type a folder to inspect its elements</label>
        <br />
        <input type="text" name="path" placeholder="path/to/inspect" />
      </form>
    );
  }
}

export default Form;