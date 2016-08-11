import * as React from 'react';
import {Item, Type, GTD} from '../models/Index';
import {hierarchy} from 'd3-hierarchy';
import {arc} from 'd3-shape';

export const ItemProgress = ({item}) => {
  if (isNaN(item.progress)) return null;
  
  const d: string = arc()({
    innerRadius: 0,
    outerRadius: 3,
    startAngle: 0,
    endAngle: Math.PI * 2 * item.progress,
  });
  
  return (
    <svg width={10} height={10}>
      <g transform="translate(5, 5)">
        <circle r="4"/>
        <path d={d}/>
      </g>
    </svg>
  );
}

export const ItemLink = ({item, currentPathname, forceUnimportant = false}) => {
  const isCurrent: boolean = currentPathname && currentPathname.indexOf(item.url) > -1;
  
  const type: string = (item.type === Type.DOCUMENT) ? 'document' : 'folder';
  const star: string = (item.isFavorite) ? '.star' : '';
  const icon: string = chrome.extension.getURL('dist/static/' + type + star + '.svg');
  
  const classes: string[] = ['item'];
  if (isCurrent) classes.push('item-current');
  if (item.isFavorite) classes.push('item-favorite');
  if (forceUnimportant || item.isUnimportant) classes.push('item-unimportant');
  
  return (<li className={classes.join(' ')}>
    <a href={item.url}><img src={icon}/>&nbsp;&nbsp;<span>{item.title}</span></a>
    <ItemProgress item={item}/>
  </li>);
}

export const ItemGroup = ({item, currentPathname, forceUnimportant = false}) => {
  const classes: string[] = ['item-group'];
  if (forceUnimportant || item.isUnimportant) classes.push('item-unimportant');
  
  return (<li className={classes.join(' ')}>
    <a href={item.url}>{item.title}</a>
  </li>);
}

export const Items = ({items, currentPathname}) => {
  const children: JSX.Element[] = items
    .map((item: Item) => {
      return <ItemLink key={item.url} item={item} currentPathname={currentPathname}/>;
    });
  return <ul>{children}</ul>;
};

export const ItemsTree = ({items, currentPathname}) => {
  const tree: Item = {
    title: 'ROOT',
    url: '-',
    type: Type.FOLDER,
    isFavorite: false,
    isUnimportant: false,
    progress: NaN,
    children: items,
    gtd: GTD.NONE
  }
  
  const children: JSX.Element[] = [];
  
  hierarchy<Item>(tree, item => item.children).eachBefore(node => {
    const item: Item = node.data;
    if (item.title === 'ROOT') return;
    
    const forceUnimportant: boolean = node.ancestors().some(node => node.data.isUnimportant);
    
    if (item.type === Type.FOLDER && item.children && item.children.length && item.children.length > -1) {
      children.push(<ItemGroup key={item.url}
                               item={item}
                               currentPathname={currentPathname}
                               forceUnimportant={forceUnimportant}/>);
    } else {
      children.push(<ItemLink key={item.url}
                              item={item}
                              currentPathname={currentPathname}
                              forceUnimportant={forceUnimportant}/>);
    }
  });
  
  return <ul>{children}</ul>;
}