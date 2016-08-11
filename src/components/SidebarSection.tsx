import * as React from 'react';

export const SidebarSection = ({children = null, title, visible, disclose, onClick}) => {
  if (!visible) return null;
  
  const disclosureImage: string = chrome.extension.getURL('dist/static/section.close.svg');
  const disclosure: JSX.Element | null = disclose ? null : <img src={disclosureImage}/>;
  if (!disclose) children = null;
  
  return (<div className="section">
    <h1 className="section-title" onClick={onClick}>
      {title}
      {disclosure}
    </h1>
    {children}
  </div>);
}