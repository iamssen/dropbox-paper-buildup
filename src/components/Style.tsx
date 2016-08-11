import * as React from 'react';
import {Options} from '../models/Options';
import {Dispatch} from 'redux';
import {connect} from 'react-redux';

const outfocusStrike = require('../styles/outfocusStrike.less');
const tinyList = require('../styles/tinyList.less');
const sidebar = require('../styles/sidebar.less');

export interface Props {
  options: Options;
  dispatch: Dispatch<Props>;
}

class Component extends React.Component<Props, {}> {
  render(): JSX.Element|any {
    if (!this.props || !this.props.options) return null;
    const options = this.props.options;
    const styles: string[] = [];
    
    if (options.outfocusStrike) styles.push(outfocusStrike);
    if (options.tinyList) styles.push(tinyList);
    if (options.enabledSidebarInbox || options.enabledSidebarSnoozed || options.enabledSidebarUnimportant || options.enabledSidebarUncategorized || options.enabledSidebarFolders || options.enabledSidebarDocuments) styles.push(sidebar);
    
    return (<style type="text/css">{styles.join('\n')}</style>);
  }
}

const mapStateToProps = (state) => ({options: state.options});

export const Style = connect(mapStateToProps)(Component);