import * as React from 'react';
import {Options} from '../models/Options';
import {
  updateOutfocusStrike,
  updateTinyList,
  updateEnabledSidebarInbox,
  updateEnabledSidebarSnoozed,
  updateEnabledSidebarUnimportant,
  updateEnabledSidebarUncategorized,
  updateEnabledSidebarFolders,
  updateEnabledSidebarDocuments
} from '../actions/options';
import {Dispatch} from 'redux';
import {connect} from 'react-redux';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import Toggle from 'material-ui/Toggle';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import {select} from 'd3-selection';

const styles = require('../styles/options.less');

select('head')
  .append('style')
  .attr('type', 'text/css')
  .text(styles);

export interface Props {
  options: Options;
  dispatch: Dispatch<Props>;
}

const OptionSwitch = ({description, state, updater, dispatch}) => {
  return <Toggle className="toggle"
                 labelPosition="right"
                 label={description}
                 toggled={state}
                 onToggle={(_, toggle:boolean) => dispatch(updater(toggle))}/>
}

class Component extends React.Component<Props, {}> {
  render(): JSX.Element|any {
    if (!this.props || !this.props.options || !this.props.dispatch) return (<div>Loading...</div>);
    const {options, dispatch} = this.props;
    
    return (<MuiThemeProvider>
      <div className="options-container">
        <Card className="options">
          <CardMedia>
            <img src={chrome.extension.getURL('dist/static/options.outfocusStrike.png')}/>
          </CardMedia>
          <CardText>
            <OptionSwitch description="Unfocused Strike Text"
                          state={options.outfocusStrike}
                          updater={updateOutfocusStrike}
                          dispatch={dispatch}/>
          </CardText>
        </Card>
        
        <Card className="options">
          <CardMedia>
            <img src={chrome.extension.getURL('dist/static/options.tinyList.png')}/>
          </CardMedia>
          <CardText>
            <OptionSwitch description="Tiny List"
                          state={options.tinyList}
                          updater={updateTinyList}
                          dispatch={dispatch}/>
          </CardText>
        </Card>
        
        <Card className="options">
          <CardHeader title="Sidebar Options"/>
          <CardMedia>
            <img src={chrome.extension.getURL('dist/static/options.sidebar.png')}/>
          </CardMedia>
          <CardText>
            <OptionSwitch description="Show Inbox (#inbox, #i)"
                          state={options.enabledSidebarInbox}
                          updater={updateEnabledSidebarInbox}
                          dispatch={dispatch}/>
            
            <OptionSwitch description="Show Snoozed (#snoozed, #s)"
                          state={options.enabledSidebarSnoozed}
                          updater={updateEnabledSidebarSnoozed}
                          dispatch={dispatch}/>
            
            <OptionSwitch description="Show Unimportant List (#-1)"
                          state={options.enabledSidebarUnimportant}
                          updater={updateEnabledSidebarUnimportant}
                          dispatch={dispatch}/>
            
            <OptionSwitch description="Show Uncategorized List"
                          state={options.enabledSidebarUncategorized}
                          updater={updateEnabledSidebarUncategorized}
                          dispatch={dispatch}/>
            
            <OptionSwitch description="Show Folders"
                          state={options.enabledSidebarFolders}
                          updater={updateEnabledSidebarFolders}
                          dispatch={dispatch}/>
            
            <OptionSwitch description="Show Documents Tree"
                          state={options.enabledSidebarDocuments}
                          updater={updateEnabledSidebarDocuments}
                          dispatch={dispatch}/>
          </CardText>
        </Card>
      </div>
    </MuiThemeProvider>)
  }
}

const mapStateToProps = (state) => ({options: state.options});

export const OptionsComponent = connect(mapStateToProps)(Component);