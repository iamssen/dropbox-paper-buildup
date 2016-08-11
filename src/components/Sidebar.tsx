import * as React from 'react';
import {Options} from '../models/Options';
import {Dispatch} from 'redux';
import {connect} from 'react-redux';
import {SidebarSection} from './SidebarSection';
import {
  updateDiscloseSidebarInbox,
  updateDiscloseSidebarSnoozed,
  updateDiscloseSidebarUnimportant,
  updateDiscloseSidebarUncategorized,
  updateDiscloseSidebarFolders,
  updateDiscloseSidebarDocuments
} from '../actions/options';
import {Items, ItemsTree} from './Items';
import {Item} from '../models/Index';

export interface Props {
  options: Options;
  inbox: Item[];
  snoozed: Item[];
  favorited: Item[];
  unimportants: Item[];
  uncategorized: Item[];
  folders: Item[];
  documents: Item[];
  dispatch: Dispatch<Props>;
  currentPathname: string;
}

class Component extends React.Component<Props, {}> {
  render(): JSX.Element|any {
    if (!this.props || !this.props.options) return (<div>Loading...</div>);
    const {
      options,
      dispatch,
      inbox,
      snoozed,
      favorited,
      unimportants,
      uncategorized,
      folders,
      currentPathname,
      documents,
    } = this.props;
    
    return (<div>
      <SidebarSection title="Inbox"
                      visible={options.enabledSidebarInbox}
                      disclose={options.discloseSidebarInbox}
                      onClick={() => dispatch(updateDiscloseSidebarInbox(!options.discloseSidebarInbox))}>
        <Items items={inbox} currentPathname={currentPathname}/>
      </SidebarSection>
      
      <SidebarSection title="Snoozed"
                      visible={options.enabledSidebarSnoozed}
                      disclose={options.discloseSidebarSnoozed}
                      onClick={() => dispatch(updateDiscloseSidebarSnoozed(!options.discloseSidebarSnoozed))}>
        <Items items={snoozed} currentPathname={currentPathname}/>
      </SidebarSection>
      
      <SidebarSection title="Unimportant"
                      visible={options.enabledSidebarUnimportant}
                      disclose={options.discloseSidebarUnimportant}
                      onClick={() => dispatch(updateDiscloseSidebarUnimportant(!options.discloseSidebarUnimportant))}>
        <Items items={unimportants} currentPathname={currentPathname}/>
      </SidebarSection>
      
      <SidebarSection title="Uncategorized"
                      visible={options.enabledSidebarUncategorized}
                      disclose={options.discloseSidebarUncategorized}
                      onClick={() => dispatch(updateDiscloseSidebarUncategorized(!options.discloseSidebarUncategorized))}>
        <Items items={uncategorized} currentPathname={currentPathname}/>
      </SidebarSection>
      
      <SidebarSection title="Folders"
                      visible={options.enabledSidebarFolders}
                      disclose={options.discloseSidebarFolders}
                      onClick={() => dispatch(updateDiscloseSidebarFolders(!options.discloseSidebarFolders))}>
        <Items items={folders} currentPathname={currentPathname}/>
      </SidebarSection>
      
      <SidebarSection title="Documents"
                      visible={options.enabledSidebarDocuments}
                      disclose={options.discloseSidebarDocuments}
                      onClick={() => dispatch(updateDiscloseSidebarDocuments(!options.discloseSidebarDocuments))}>
        <ItemsTree items={documents} currentPathname={currentPathname}/>
      </SidebarSection>
    </div>)
  }
}

const mapStateToProps = (state) => ({
  options: state.options,
  inbox: state.inbox,
  snoozed: state.snoozed,
  favorited: state.favorited,
  unimportants: state.unimportants,
  uncategorized: state.uncategorized,
  folders: state.folders,
  documents: state.documents,
  currentPathname: state.currentPathname,
});

export const Sidebar = connect(mapStateToProps)(Component);