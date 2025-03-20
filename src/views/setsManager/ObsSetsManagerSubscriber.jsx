import React, {
  useEffect,
  useMemo,
  useCallback,
  useState,
} from 'react';
import { isEqual, range } from 'lodash-es';
import {
  useCoordination,
  useLoaders,
  useSetWarning,
  TitleInfo,
  useUrls,
  useReady,
  useObsSetsData,

} from '@vitessce/vit-s';
import { IconButton, Grid } from '@material-ui/core';

import {
  COMPONENT_COORDINATION_TYPES,
  ViewType,
  ViewHelpMapping,
} from '@vitessce/constants-internal';
import {
  treeExportLevelZeroNode,
  treeExportSet,
  treeToExpectedCheckedLevel,
  nodeToLevelDescendantNamePaths,
  treeToIntersection,
  treeToUnion,
  treeToComplement,
  treeFindNodeByNamePath,
  treesConflict,
  nodeTransform,
  nodeAppendChild,
  nodePrependChild,
  nodeInsertChild,
  filterNode,
  treeInitialize,
  initializeCellSetColor,
  isEqualOrPrefix,
  tryRenamePath,
  PATH_SEP,
  downloadForUser,
  handleExportJSON,
  handleExportTabular,
  tryUpgradeTreeToLatestSchema,
  FILE_EXTENSION_JSON,
  FILE_EXTENSION_TABULAR,
  SETS_DATATYPE_OBS,
  setObsSelection,
  mergeObsSets,
  getNextNumberedNodeName,
  nodeToRenderProps,
  pathToKey,
  callbackOnKeyPress,
  colorArrayToString,
  getLevelTooltipText,
  handleImportTabular,
  MIME_TYPE_TABULAR,
  MIME_TYPE_JSON,
  handleImportJSON
} from '@vitessce/sets-utils';
import { capitalize, getDefaultColor } from '@vitessce/utils';

import { GroupWork as GroupWorkIcon } from '@material-ui/icons';
import { useStyles } from './styles.js';
import './styles.css'
import RcTree, { TreeNode as RcTreeNode } from 'rc-tree';
import clsx from 'clsx';
import { getDataAndAria } from 'rc-tree/es/util.js';
import { MenuSVG } from '@vitessce/icons';
import HelpTooltip from './HelpTooltip.jsx';
import PopoverMenu from './PopoverMenu.jsx';
import useStore from '../../store';
import SetDiff from './SetDiff.jsx';
import LayerOverlays from './LayerOverlays.jsx';



/**
 * A plus button for creating or importing set hierarchies.
 * @param {object} props
 * @param {string} props.datatype The data type to validate imported hierarchies against.
 * @param {function} props.onError A callback to pass error message strings.
 * @param {function} props.onImportTree A callback to pass successfully-validated tree objects.
 * @param {function} props.onCreateLevelZeroNode A callback to create a new empty
 * level zero node.
 * @param {boolean} props.importable Is importing allowed?
 * If not, the import button will not be rendered.
 * @param {boolean} props.editable Is editing allowed?
 * If not, the create button will not be rendered.
 */
function PlusButton(props) {
  const {
    datatype, onError, onImportTree, onCreateLevelZeroNode,
    importable, editable,
  } = props;

  const classes = useStyles();

  /**
   * Import a file, then process the imported data via the supplied handler function.
   * @param {Function} importHandler The function to process the imported data.
   * @param {string} mimeType The accepted mime type for the file upload input.
   * @returns {Function} An import function corresponding to the supplied parameters.
   */
  const onImport = useCallback((importHandler, mimeType) => () => {
    const uploadInputNode = document.createElement('input');
    uploadInputNode.setAttribute('type', 'file');
    uploadInputNode.setAttribute('accept', mimeType);
    document.body.appendChild(uploadInputNode); // required for firefox
    uploadInputNode.click();
    uploadInputNode.addEventListener('change', (event) => {
      if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
        onError('Local file reading APIs are not fully supported in this browser.');
        return;
      }
      const { files } = event.target;
      if (!files || files.length !== 1) {
        onError('Incorrect number of files selected.');
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const { result } = reader;
        try {
          const treeToImport = importHandler(result, datatype);
          onError(false); // Clear any previous import error.
          onImportTree(treeToImport);
        } catch (e) {
          onError(e.message);
        }
      }, false);
      reader.readAsText(files[0]);
    });
    uploadInputNode.remove();
  }, [datatype, onError, onImportTree]);

  const menuConfig = [
    ...(editable ? [
      {
        title: 'Create hierarchy',
        handler: onCreateLevelZeroNode,
        handlerKey: 'n',
      },
    ] : []),
    ...(importable ? [
      {
        title: 'Import hierarchy',
        subtitle: '(from CSV file)',
        handler: onImport(handleImportTabular, MIME_TYPE_TABULAR),
        handlerKey: 'c',
      },
      {
        title: 'Import hierarchy',
        subtitle: '(from JSON file)',
        handler: onImport(handleImportJSON, MIME_TYPE_JSON),
        handlerKey: 'j',
      },
    ] : []),
  ];

  return (menuConfig.length > 0 ? (
    <PopoverMenu
      menuConfig={menuConfig}
    >
      <button className={classes.plusButton} type="submit">+</button>
    </PopoverMenu>
  ) : null);
}

/**
 * Set operations buttons (union, intersection, complement)
 * and a view checked sets button.
 * @param {object} props
 * @param {function} props.onUnion A callback for the union button.
 * @param {function} props.onIntersection A callback for the intersection button.
 * @param {function} props.onComplement A callback for the complement button.
 * @param {boolean} props.operatable Are set operations allowed?
 * If not, the union, intersection, and complement buttons will not be rendered.
 */
function SetOperationButtons(props) {
  const {
    onUnion,
    onIntersection,
    onComplement,
    operatable,
    hasCheckedSetsToUnion,
    hasCheckedSetsToIntersect,
    hasCheckedSetsToComplement,
  } = props;

  return (
    <>
      {operatable && (
        <>
          <button
            onClick={onUnion}
            title="New set from union of checked sets"
            type="submit"
            disabled={!hasCheckedSetsToUnion}
          >
            <SetUnionSVG />
          </button>
          <button
            onClick={onIntersection}
            title="New set from intersection of checked sets"
            type="submit"
            disabled={!hasCheckedSetsToIntersect}
          >
            <SetIntersectionSVG />
          </button>
          <button
            onClick={onComplement}
            title="New set from complement of checked sets"
            type="submit"
            disabled={!hasCheckedSetsToComplement}
          >
            <SetComplementSVG />
          </button>
        </>
      )}
    </>
  );
}


const Tree = React.forwardRef((props, ref) => {
  const {
    prefixCls,
    className,
    showIcon,
    blockNode,
    children,
    checkable,
  } = props;
  // Do not render RcTree if the tree nodes have not yet loaded.
  return (children?.length > 0 ? (
    <RcTree
      itemHeight={32}
      ref={ref}
      {...props}
      className={clsx(className, {
        [`${prefixCls}-icon-hide`]: !showIcon,
        [`${prefixCls}-block-node`]: blockNode,
      })}
      checkable={checkable ? <span className={`${prefixCls}-checkbox-inner`} /> : checkable}
      checkStrictly={false}
    >
      {children}
    </RcTree>
  ) : null);
});
Tree.displayName = 'Tree';
Tree.defaultProps = {
  virtual: false,
  checkable: false,
  showIcon: false,
  blockNode: true,
  prefixCls: 'rc-tree',
};


function makeNodeViewMenuConfig(props) {
  const {
    path,
    level,
    height,
    onCheckNode,
    onNodeRemove,
    onNodeSetIsEditing,
    onExportLevelZeroNodeJSON,
    onExportLevelZeroNodeTabular,
    onExportSetJSON,
    checkable,
    editable,
    exportable,
    checked,
  } = props;

  return [
    ...(editable ? [
      {
        title: 'Rename',
        handler: () => { onNodeSetIsEditing(path, true); },
        handlerKey: 'r',
      },
      {
        title: 'Delete',
        confirm: true,
        handler: () => { onNodeRemove(path); },
        handlerKey: 'd',
      },
    ] : []),
    ...(level === 0 && exportable ? [
      {
        title: 'Export hierarchy',
        subtitle: '(to JSON file)',
        handler: () => { onExportLevelZeroNodeJSON(path); },
        handlerKey: 'j',
      },
      ...(height <= 1 ? [
        {
          title: 'Export hierarchy',
          subtitle: '(to CSV file)',
          handler: () => { onExportLevelZeroNodeTabular(path); },
          handlerKey: 't',
        },
      ] : []),
    ] : []),
    ...(level > 0 ? [
      ...(checkable ? [
        {
          title: (checked ? 'Uncheck' : 'Check'),
          handler: () => { onCheckNode(path, !checked); },
          handlerKey: 's',
        },
      ] : []),
      ...(exportable ? [
        {
          title: 'Export set',
          subtitle: '(to JSON file)',
          handler: () => { onExportSetJSON(path); },
          handlerKey: 'e',
        },
      ] : []),
    ] : []),
  ];
}

/**
 * The "static" node component to render when the user is not renaming.
 * @param {object} props The props for the TreeNode component.
 */
function NamedSetNodeStatic(props) {
  const {
    title,
    path,
    nodeKey,
    level,
    height,
    color,
    checkbox,
    isChecking,
    isLeaf,
    onNodeSetColor,
    onNodeView,
    expanded,
    onCheckLevel,
    checkedLevelPath,
    checkedLevelIndex,
    disableTooltip,
    size,
    datatype,
    editable,
    theme,
  } = props;
  const shouldCheckNextLevel = (level === 0 && !expanded);
  const nextLevelToCheck = (
    (checkedLevelIndex && isEqual(path, checkedLevelPath) && checkedLevelIndex < height)
      ? checkedLevelIndex + 1
      : 1
  );
  const numberFormatter = new Intl.NumberFormat('en-US');
  const niceSize = numberFormatter.format(size);
  // If this is a level zero node and is _not_ expanded, then upon click,
  // the behavior should be to color by the first or next cluster level.
  // If this is a level zero node and _is_ expanded, or if any other node,
  // click should trigger onNodeView.
  const onClick = (level === 0 && !expanded
    ? () => onCheckLevel(nodeKey, nextLevelToCheck)
    : () => onNodeView(path)
  );
  const tooltipProps = { visible: false };
  const popoverMenuConfig = makeNodeViewMenuConfig(props);
  const hoveredCluster = useStore((state) => state.hoveredCluster);
  const setHoveredCluster = useStore((state) => state.setHoveredCluster);


  const classes = useStyles();
  return (
    <span>
      <HelpTooltip {...tooltipProps}>
        <button
          type="button"
          onClick={onClick}
          onMouseEnter={() => {
            if (level === 0) setHoveredCluster(null);
            else setHoveredCluster({ path, level, nodeKey });

          }}
          onMouseLeave={() => setHoveredCluster(null)}
          onKeyPress={e => callbackOnKeyPress(e, 'v', () => onNodeView(path))}
          className={classes.titleButton}
        >
          {title}
        </button>
      </HelpTooltip>
      {popoverMenuConfig.length > 0 ? (
        <PopoverMenu
          menuConfig={makeNodeViewMenuConfig(props)}
          color={level > 0 && editable ? (color || getDefaultColor(theme)) : null}
          setColor={c => onNodeSetColor(path, c)}
        >
          <MenuSVG className={classes.nodeMenuIcon} />
        </PopoverMenu>
      ) : null}
      {level > 0 && isChecking ? checkbox : null}
      {level > 0 && (<span className={classes.nodeSizeLabel}>{niceSize}</span>)}
    </span>
  );
}

/**
 * The "editing" node component to render when the user is renaming,
 * containing a text input field and a save button.
 * @param {object} props The props for the TreeNode component.
 */
function NamedSetNodeEditing(props) {
  const {
    title,
    path,
    onNodeSetName,
    onNodeCheckNewName,
  } = props;
  const [currentTitle, setCurrentTitle] = useState(title);

  // Do not allow the user to save a potential name if it conflicts with
  // another name in the hierarchy.
  const hasConflicts = onNodeCheckNewName(path, currentTitle);
  function trySetName() {
    if (!hasConflicts) {
      onNodeSetName(path, currentTitle, true);
    }
  }
  const classes = useStyles();
  return (
    <span className={classes.titleButtonWithInput}>
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        className={classes.titleInput}
        type="text"
        value={currentTitle}
        onChange={(e) => { setCurrentTitle(e.target.value); }}
        onKeyPress={e => callbackOnKeyPress(
          e,
          'Enter',
          trySetName,
        )}
        onFocus={e => e.target.select()}
      />
      {!hasConflicts && (
        <button
          type="button"
          className={classes.titleSaveButton}
          onClick={trySetName}
        >
          Save
        </button>
      )}
    </span>
  );
}

/**
 * A "delegation" component, to decide whether to render
 * an "editing" vs. "static" node component.
 * @param {object} props The props for the TreeNode component.
 */
function NamedSetNode(props) {
  const {
    isEditing,
    isCurrentSet,
  } = props;
  return (
    (isEditing || isCurrentSet)
      ? (<NamedSetNodeEditing {...props} />)
      : (<NamedSetNodeStatic {...props} />)
  );
}

/**
 * Buttons for viewing each hierarchy level,
 * rendered below collapsed level zero nodes.
 * @param {object} props The props for the (level zero) TreeNode component.
 */
function LevelsButtons(props) {
  const {
    nodeKey,
    path,
    height,
    onCheckLevel,
    checkedLevelPath,
    checkedLevelIndex,
    hasColorEncoding,
  } = props;
  function onCheck(event) {
    if (event.target.checked) {
      const newLevel = parseInt(event.target.value, 10);
      onCheckLevel(nodeKey, newLevel);
    }
  }
  const classes = useStyles();
  return (
    <div className={classes.levelButtonsContainer}>
      {range(1, height + 1).map((i) => {
        const isChecked = isEqual(path, checkedLevelPath) && i === checkedLevelIndex;
        return (
          <div key={i}>
            <HelpTooltip title={getLevelTooltipText(i)}>
              <input
                className={clsx(classes.levelRadioButton, { [classes.levelRadioButtonChecked]: isChecked && !hasColorEncoding })}
                type="checkbox"
                value={i}
                checked={isChecked && hasColorEncoding}
                onChange={onCheck}
              />
            </HelpTooltip>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Render the "switcher" icon.
 * Arrow for collapsed/expanded non-leaf nodes,
 * or square for leaf nodes.
 * @param {object} props The props for the TreeNode component.
 */
function SwitcherIcon(props) {
  const {
    isLeaf, isOpen, color,
  } = props;
  const hexColor = (color ? colorArrayToString(color) : undefined);
  if (isLeaf) {
    return (
      <i
        className="anticon anticon-circle rc-tree-switcher-icon"
      >
        <svg
          viewBox="0 0 1024 1024"
          focusable="false"
          data-icon="caret-down"
          width="1em"
          height="1em"
          aria-hidden="true"
        >
          <rect fill={hexColor} x={600 / 2} y={600 / 2} width={1024 - 600} height={1024 - 600} />
        </svg>
      </i>
    );
  }
  return (
    <i
      className="anticon anticon-caret-down rc-tree-switcher-icon"
    >
      <svg
        viewBox="0 0 1024 1024"
        focusable="false"
        data-icon="caret-down"
        width="1em"
        height="1em"
        aria-hidden="true"
      >
        <path
          fill={(isOpen ? '#444' : hexColor)}
          d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"
        />
      </svg>
    </i>
  );
}

/**
 * A custom TreeNode component.
 * @extends {RcTreeNode} TreeNode from the rc-tree library.
 */
class TreeNode extends RcTreeNode {
  /**
   * Override the main node text elements.
   */
  renderSelector = () => {
    const {
      title,
      isCurrentSet,
      isSelected,
      isEditing,
      onDragStart: onDragStartProp,
    } = this.props;
    const {
      rcTree: {
        prefixCls: prefixClass,
        draggable,
      },
    } = this.context;

    const onDragStart = (e) => {
      onDragStartProp();
      this.onDragStart(e);
    };

    const wrapClass = `${prefixClass}-node-content-wrapper`;
    const isDraggable = (!isCurrentSet && !isEditing && draggable);
    return (
      <span
        ref={this.setSelectHandle}
        title={title}
        className={clsx(
          wrapClass,
          `${wrapClass}-${this.getNodeState() || 'normal'}`,
          isSelected && `${prefixClass}-node-selected`,
          isDraggable && 'draggable',
        )}
        draggable={isDraggable}
        aria-grabbed={isDraggable}
        onDragStart={isDraggable ? onDragStart : undefined}
      >
        <NamedSetNode
          {...this.props}
          prefixClass={prefixClass}
          checkbox={this.renderCheckbox()}
        />
        {this.renderLevels()}
      </span>
    );
  };

  /**
   * Render the LevelsButtons component if this node
   * is a collapsed level zero node.
   */
  renderLevels = () => {
    const { level, expanded } = this.props;
    if (level !== 0 || expanded) {
      return null;
    }
    return (
      <LevelsButtons
        {...this.props}
      />
    );
  };

  /**
   * Override the switcher element.
   */
  renderSwitcher = () => {
    const { expanded, isLeaf, color } = this.props;
    const {
      rcTree: {
        prefixCls: prefixClass,
        onNodeExpand,
      },
    } = this.context;

    const onNodeExpandWrapper = (e) => {
      // Do not call onNodeExpand if the node is a leaf node.
      if (!isLeaf) {
        onNodeExpand(e, this);
      }
    };

    const switcherClass = clsx(
      `${prefixClass}-switcher`,
      { [`${prefixClass}-switcher_${(expanded ? 'open' : 'close')}`]: !isLeaf },
    );
    return (
      <span
        className={switcherClass}
        onClick={onNodeExpandWrapper}
        onKeyPress={e => callbackOnKeyPress(e, 'd', onNodeExpandWrapper)}
        role="button"
        tabIndex="0"
      >
        <SwitcherIcon
          isLeaf={isLeaf}
          isOpen={expanded}
          color={color}
        />
      </span>
    );
  };

  /**
   * Override main render function,
   * to enable overriding the sub-render functions
   * for switcher, selector, etc.
   */
  render() {
    const {
      style, loading, level,
      dragOver, dragOverGapTop, dragOverGapBottom,
      isLeaf,
      expanded, selected, checked, halfChecked,
      onDragEnd: onDragEndProp,
      expandable,
      ...otherProps
    } = this.props;
    const {
      rcTree: {
        prefixCls: prefixClass,
        filterTreeNode,
        draggable,
      },
    } = this.context;
    const disabled = this.isDisabled();
    const dataAndAriaAttributeProps = getDataAndAria(otherProps);

    const onDragEnd = (e) => {
      onDragEndProp();
      this.onDragEnd(e);
    };

    return (
      <li
        className={clsx('rc-tree-treenode', `level-${level}-treenode`, {
          [`${prefixClass}-treenode-disabled`]: disabled,
          [`${prefixClass}-treenode-switcher-${expanded ? 'open' : 'close'}`]: !isLeaf,
          [`${prefixClass}-treenode-checkbox-checked`]: checked,
          [`${prefixClass}-treenode-checkbox-indeterminate`]: halfChecked,
          [`${prefixClass}-treenode-selected`]: selected,
          [`${prefixClass}-treenode-loading`]: loading,

          'drag-over': !disabled && dragOver,
          'drag-over-gap-top': !disabled && dragOverGapTop,
          'drag-over-gap-bottom': !disabled && dragOverGapBottom,
          'filter-node': filterTreeNode && filterTreeNode(this),
        })}
        style={style}
        role="treeitem"
        aria-selected={selected}
        onDragEnter={draggable ? this.onDragEnter : undefined}
        onDragOver={draggable ? this.onDragOver : undefined}
        onDragLeave={draggable ? this.onDragLeave : undefined}
        onDrop={draggable ? this.onDrop.bind(this) : undefined}
        onDragEnd={draggable ? onDragEnd : undefined}
        {...dataAndAriaAttributeProps}
      >
        {expandable ? this.renderSwitcher() : null}
        {this.renderSelector()}
        {this.renderChildren()}
      </li>
    );
  }
}


function processNode(node, prevPath, setColor, theme) {
  const nodePath = [...prevPath, node.name];
  return {
    ...node,
    ...(node.children ? ({
      children: node.children
        .map(c => processNode(c, nodePath, setColor)),
    }) : {}),
    color: setColor?.find(d => isEqual(d.path, nodePath))?.color || getDefaultColor(theme),
  };
}

function processSets(sets, setColor, theme) {
  return {
    ...sets,
    tree: sets ? sets.tree.map(lzn => processNode(lzn, [], setColor, theme)) : [],
  };
}

function getAllKeys(node, path = []) {
  if (!node) {
    return null;
  }
  const newPath = [...path, node.name];
  if (node.children) {
    return [pathToKey(newPath), ...node.children.flatMap(v => getAllKeys(v, newPath))];
  }
  return pathToKey(newPath);
}

/**
 * A generic hierarchical set manager component.
 * @prop {object} tree An object representing set hierarchies.
 * @prop {string} datatype The data type for sets (e.g. "cell")
 * @prop {function} clearPleaseWait A callback to signal that loading is complete.
 * @prop {boolean} draggable Whether tree nodes can be rearranged via drag-and-drop.
 * By default, true.
 * @prop {boolean} checkable Whether to show the "Check" menu button
 * and checkboxes for selecting multiple sets. By default, true.
 * @prop {boolean} editable Whether to show rename, delete, color, or create options.
 * By default, true.
 * @prop {boolean} expandable Whether to allow hierarchies to be expanded
 * to show the list or tree of sets contained. By default, true.
 * @prop {boolean} operatable Whether to enable union, intersection,
 * and complement operations on checked sets. By default, true.
 * @prop {boolean} exportable Whether to enable exporting hierarchies and sets to files.
 * By default, true.
 * @prop {boolean} importable Whether to enable importing hierarchies from files.
 * By default, true.
 * @prop {function} onError Function to call with error messages (failed import validation, etc).
 * @prop {function} onCheckNode Function to call when a single node has been checked or un-checked.
 * @prop {function} onExpandNode Function to call when a node has been expanded.
 * @prop {function} onDropNode Function to call when a node has been dragged-and-dropped.
 * @prop {function} onCheckLevel Function to call when an entire hierarchy level has been selected,
 * via the "Color by cluster" and "Color by subcluster" buttons below collapsed level zero nodes.
 * @prop {function} onNodeSetColor Function to call when a new node color has been selected.
 * @prop {function} onNodeSetName Function to call when a node has been renamed.
 * @prop {function} onNodeRemove Function to call when the user clicks the "Delete" menu button
 * to remove a node.
 * @prop {function} onNodeView Function to call when the user wants to view the set associated
 * with a particular node.
 * @prop {function} onImportTree Function to call when a tree has been imported
 * using the "plus" button.
 * @prop {function} onCreateLevelZeroNode Function to call when a user clicks the "Create hierarchy"
 * menu option using the "plus" button.
 * @prop {function} onExportLevelZeroNode Function to call when a user wants to
 * export an entire hierarchy via the "Export hierarchy" menu button for a
 * particular level zero node.
 * @prop {function} onExportSet Function to call when a user wants to export a set associated with
 * a particular node via the "Export set" menu button.
 * @prop {function} onUnion Function to call when a user wants to create a new set from the union
 * of the sets associated with the currently-checked nodes.
 * @prop {function} onIntersection Function to call when a user wants to create a new set from the
 * intersection of the sets associated with the currently-checked nodes.
 * @prop {function} onComplement Function to call when a user wants to create a new set from the
 * complement of the (union of the) sets associated with the currently-checked nodes.
 * @prop {function} onView Function to call when a user wants to view the sets
 * associated with the currently-checked nodes.
 * @prop {string} theme "light" or "dark" for the vitessce theme
 */
function SetsManager(props) {
  const {
    theme,
    sets,
    additionalSets,
    setColor,
    levelSelection: checkedLevel,
    setSelection,
    setExpansion,
    hasColorEncoding,
    datatype,
    draggable = true,
    checkable = true,
    editable = true,
    expandable = true,
    operatable = true,
    exportable = true,
    importable = true,
    onError,
    onCheckNode,
    onExpandNode,
    onDropNode,
    onCheckLevel,
    onNodeSetColor,
    onNodeSetName,
    onNodeCheckNewName,
    onNodeRemove,
    onNodeView,
    onImportTree,
    onCreateLevelZeroNode,
    onExportLevelZeroNodeJSON,
    onExportLevelZeroNodeTabular,
    onExportSetJSON,
    onUnion,
    onIntersection,
    onComplement,
    hasCheckedSetsToUnion,
    hasCheckedSetsToIntersect,
    hasCheckedSetsToComplement,
    cellSetSelection
  } = props;

  const isChecking = true;
  const autoExpandParent = true;
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingNodeName, setIsEditingNodeName] = useState(null);



  const processedSets = useMemo(() => processSets(
    sets, setColor, theme,
  ), [sets, setColor, theme]);
  const processedAdditionalSets = useMemo(() => processSets(
    additionalSets, setColor, theme,
  ), [additionalSets, setColor, theme]);

  const additionalSetKeys = (processedAdditionalSets
    ? processedAdditionalSets.tree.flatMap(v => getAllKeys(v, []))
    : []
  );

  const allSetSelectionKeys = (setSelection || []).map(pathToKey);
  const allSetExpansionKeys = (setExpansion || []).map(pathToKey);

  const setSelectionKeys = allSetSelectionKeys.filter(k => !additionalSetKeys.includes(k));
  const setExpansionKeys = allSetExpansionKeys.filter(k => !additionalSetKeys.includes(k));

  const additionalSetSelectionKeys = allSetSelectionKeys.filter(k => additionalSetKeys.includes(k));
  const additionalSetExpansionKeys = allSetExpansionKeys.filter(k => additionalSetKeys.includes(k));

  /**
   * Recursively render TreeNode components.
   * @param {object[]} nodes An array of node objects.
   * @returns {TreeNode[]|null} Array of TreeNode components or null.
   */
  function renderTreeNodes(nodes, readOnly, currPath) {
    if (!nodes) {
      return null;
    }
    return nodes.map((node) => {
      const newPath = [...currPath, node.name];
      return (
        <TreeNode
          theme={theme}
          key={pathToKey(newPath)}
          {...nodeToRenderProps(node, newPath, setColor)}

          isEditing={isEqual(isEditingNodeName, newPath)}

          datatype={datatype}
          draggable={draggable && !readOnly}
          editable={editable && !readOnly}
          checkable={checkable}
          expandable={expandable}
          exportable={exportable}

          hasColorEncoding={hasColorEncoding}
          isChecking={isChecking}
          checkedLevelPath={checkedLevel ? checkedLevel.levelZeroPath : null}
          checkedLevelIndex={checkedLevel ? checkedLevel.levelIndex : null}

          onCheckNode={onCheckNode}
          onCheckLevel={onCheckLevel}
          onNodeView={onNodeView}
          onNodeSetColor={onNodeSetColor}
          onNodeSetName={(targetPath, name) => {
            onNodeSetName(targetPath, name);
            setIsEditingNodeName(null);
          }}
          onNodeCheckNewName={onNodeCheckNewName}
          onNodeSetIsEditing={setIsEditingNodeName}
          onNodeRemove={onNodeRemove}
          onExportLevelZeroNodeJSON={onExportLevelZeroNodeJSON}
          onExportLevelZeroNodeTabular={onExportLevelZeroNodeTabular}
          onExportSetJSON={onExportSetJSON}

          disableTooltip={isDragging}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
        >
          {renderTreeNodes(node.children, readOnly, newPath, theme)}
        </TreeNode>
      );
    });
  }


  const classes = useStyles();

  return (
    <div className={classes.setsManager}>
      

      <div className={classes.setsManagerTree}>
        <Tree
          draggable={false}
          checkable={checkable}

          checkedKeys={setSelectionKeys}
          expandedKeys={setExpansionKeys}
          autoExpandParent={autoExpandParent}

          onCheck={(checkedKeys, info) => onCheckNode(
            info.node.props.nodeKey,
            info.checked,
          )}
          onExpand={(expandedKeys, info) => onExpandNode(
            expandedKeys,
            info.node.props.nodeKey,
            info.expanded,
          )}
        >
          {renderTreeNodes(processedSets.tree, true, [], theme)}
        </Tree>
        <Tree
          draggable /* TODO */
          checkable={checkable}

          checkedKeys={additionalSetSelectionKeys}
          expandedKeys={additionalSetExpansionKeys}
          autoExpandParent={autoExpandParent}

          onCheck={(checkedKeys, info) => onCheckNode(
            info.node.props.nodeKey,
            info.checked,
          )}
          onExpand={(expandedKeys, info) => onExpandNode(
            expandedKeys,
            info.node.props.nodeKey,
            info.expanded,
          )}
          onDrop={(info) => {
            const { eventKey: dropKey } = info.node.props;
            const { eventKey: dragKey } = info.dragNode.props;
            const { dropToGap, dropPosition } = info;
            onDropNode(dropKey, dragKey, dropPosition, dropToGap);
          }}
        >
          {renderTreeNodes(processedAdditionalSets.tree, false, [], theme)}
        </Tree>

        <PlusButton
          datatype={datatype}
          onError={onError}
          onImportTree={onImportTree}
          onCreateLevelZeroNode={onCreateLevelZeroNode}
          importable={importable}
          editable={editable}
        />
      </div>
      <div className={classes.setDiff}>

        <SetDiff cellSetSelection={cellSetSelection} />
      </div>
      <div className={classes.layerOverlays}>

        <LayerOverlays  />
      </div>
    </div >
  );
}


// TODO(monorepo): import package.json
// import packageJson from '../../../package.json';
const packageJson = { name: 'vitessce' };

/**
 * A subscriber wrapper around the SetsManager component
 * for the 'cell' datatype.
 * @param {object} props
 * @param {string} props.theme The current theme name.
 * @param {object} props.coordinationScopes The mapping from coordination types to coordination
 * scopes.
 * @param {function} props.removeGridComponent The callback function to pass to TitleInfo,
 * to call when the component has been removed from the grid.
 * @param {string} props.title The component title.
 */
export function ObsSetsManagerSubscriber(props) {
  const {
    coordinationScopes,
    closeButtonVisible,
    downloadButtonVisible,
    removeGridComponent,
    theme,
    title: titleOverride,
    helpText = ViewHelpMapping.OBS_SETS,
  } = props;

  const setSelectionPath = useStore((state) => state.setSelectionPath)

  const loaders = useLoaders();
  const setWarning = useSetWarning();

  // Get "props" from the coordination space.
  const [{
    dataset,
    obsType,
    obsSetSelection: cellSetSelection,
    obsSetExpansion: cellSetExpansion,
    obsSetColor: cellSetColor,
    additionalObsSets: additionalCellSets,
    obsColorEncoding: cellColorEncoding,
  }, {
    setObsSetSelection: setCellSetSelection,
    setObsColorEncoding: setCellColorEncoding,
    setObsSetColor: setCellSetColor,
    setObsSetExpansion: setCellSetExpansion,
    setAdditionalObsSets: setAdditionalCellSets,
  }] = useCoordination(COMPONENT_COORDINATION_TYPES[ViewType.OBS_SETS], coordinationScopes);

  const title = titleOverride || `${capitalize(obsType)} Sets`;

  // Reset file URLs and loader progress when the dataset has changed.
  useEffect(() => {
    if (cellSetExpansion && cellSetExpansion.length > 0) {
      setCellSetExpansion([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaders, dataset]);

  // Get data from loaders using the data hooks.
  const [{ obsIndex, obsSets: cellSets }, obsSetsStatus, obsSetsUrls] = useObsSetsData(
    loaders, dataset, false,
    { setObsSetSelection: setCellSetSelection, setObsSetColor: setCellSetColor },
    { obsSetSelection: cellSetSelection, obsSetColor: cellSetColor },
    { obsType },
  );
  const isReady = useReady([obsSetsStatus]);
  const urls = useUrls([obsSetsUrls]);

  // Validate and upgrade the additionalCellSets.
  useEffect(() => {
    if (additionalCellSets) {
      let upgradedCellSets;
      let didUpgrade;
      try {
        [upgradedCellSets, didUpgrade] = tryUpgradeTreeToLatestSchema(
          additionalCellSets, SETS_DATATYPE_OBS,
        );
      } catch (e) {
        setWarning(e.message);
        return;
      }
      if (didUpgrade) {
        setAdditionalCellSets(upgradedCellSets);
      }
    }
  }, [additionalCellSets, setAdditionalCellSets, setWarning]);

  // Get an array of all cell IDs to use for set complement operations.
  const allCellIds = useMemo(() => (obsIndex || []), [obsIndex]);

  // A helper function for updating the encoding for cell colors,
  // which may have previously been set to 'geneSelection'.
  const setCellSetColorEncoding = useCallback(() => {
    setCellColorEncoding('cellSetSelection');
  }, [setCellColorEncoding]);

  // Merged cell sets are only to be used for convenience when reading
  // (if writing: update either `cellSets` _or_ `additionalCellSets`).
  const mergedCellSets = useMemo(
    () => mergeObsSets(cellSets, additionalCellSets),
    [cellSets, additionalCellSets],
  );

  // Infer the state of the "checked level" radio button based on the selected cell sets.
  const checkedLevel = useMemo(() => {
    if (cellSetSelection && cellSetSelection.length > 0
      && mergedCellSets && mergedCellSets.tree.length > 0) {
      return treeToExpectedCheckedLevel(mergedCellSets, cellSetSelection);
    }
    return null;
  }, [cellSetSelection, mergedCellSets]);

  // Callback functions

  // The user wants to select all nodes at a particular hierarchy level.
  const onCheckLevel = useCallback((levelZeroName, levelIndex) => {
    const lzn = mergedCellSets.tree.find(n => n.name === levelZeroName);
    if (lzn) {
      const newCellSetSelection = nodeToLevelDescendantNamePaths(lzn, levelIndex, [], true);
      setCellSetSelection(newCellSetSelection);
      setCellSetColorEncoding();
    }
  }, [mergedCellSets, setCellSetColorEncoding, setCellSetSelection]);

  // The user wants to check or uncheck a cell set node.
  const onCheckNode = useCallback((targetKey, checked) => {
    const targetPath = (Array.isArray(targetKey) ? targetKey : targetKey.split(PATH_SEP));
    if (!targetKey) {
      return;
    }
    if (checked) {
      setCellSetSelection([...cellSetSelection, targetPath]);
    } else {
      setCellSetSelection(cellSetSelection.filter(d => !isEqual(d, targetPath)));
    }
    setCellSetColorEncoding();
  }, [cellSetSelection, setCellSetColorEncoding, setCellSetSelection]);

  // The user wants to expand or collapse a node in the tree.
  const onExpandNode = useCallback((expandedKeys, targetKey, expanded) => {
    const prevCellSetExpansion = cellSetExpansion || [];
    if (expanded) {
      setCellSetExpansion([...prevCellSetExpansion, targetKey.split(PATH_SEP)]);
    } else {
      const newCellSetExpansion = prevCellSetExpansion.filter(
        d => !isEqual(d, targetKey.split(PATH_SEP)),
      );
      setCellSetExpansion(newCellSetExpansion);
    }
  }, [cellSetExpansion, setCellSetExpansion]);

  // The user dragged a tree node and dropped it somewhere else in the tree
  // to re-arrange or re-order the nodes.
  // We need to verify that their drop target is valid, and if so, complete
  // the tree re-arrangement.
  const onDropNode = useCallback((dropKey, dragKey, dropPosition, dropToGap) => {
    const dropPath = dropKey.split(PATH_SEP);
    const dropNode = treeFindNodeByNamePath(additionalCellSets, dropPath);
    if (!dropNode.children && !dropToGap) {
      // Do not allow a node with a set (i.e. leaf) to become a child of another node with a set,
      // as this will result in an internal node having a set, which we do not allow.
      return;
    }
    const dropNodeLevel = dropPath.length - 1;
    const dropNodeIsLevelZero = dropNodeLevel === 0;

    // Get drag node.
    const dragPath = dragKey.split(PATH_SEP);
    const dragNode = treeFindNodeByNamePath(additionalCellSets, dragPath);

    if (dropNodeIsLevelZero && dropToGap && !dragNode.children) {
      // Do not allow a leaf node to become a level zero node.
      return;
    }

    let dropParentNode;
    let dropParentPath;
    let dropNodeCurrIndex;
    if (!dropNodeIsLevelZero) {
      dropParentPath = dropPath.slice(0, -1);
      dropParentNode = treeFindNodeByNamePath(additionalCellSets, dropParentPath);
      dropNodeCurrIndex = dropParentNode.children.findIndex(c => c.name === dropNode.name);
    } else {
      dropNodeCurrIndex = additionalCellSets.tree.findIndex(
        lzn => lzn.name === dropNode.name,
      );
    }
    // Further, only allow dragging if the dragged node will have a unique
    // name among its new siblings.
    let hasSiblingNameConflict;
    const dragNodeName = dragNode.name;
    if (!dropNodeIsLevelZero && dropToGap) {
      hasSiblingNameConflict = dropParentNode.children
        .find(c => c !== dragNode && c.name === dragNodeName);
    } else if (!dropToGap) {
      hasSiblingNameConflict = dropNode.children
        .find(c => c !== dragNode && c.name === dragNodeName);
    } else {
      hasSiblingNameConflict = additionalCellSets.tree
        .find(lzn => lzn !== dragNode && lzn.name === dragNodeName);
    }

    if (hasSiblingNameConflict) {
      return;
    }

    // Remove the dragged object from its current position.
    // Recursively check whether each node path
    // matches the path of the node to delete.
    // If so, return null, and then always use
    // .filter(Boolean) to eliminate any null array elements.
    const nextAdditionalCellSets = {
      ...additionalCellSets,
      tree: additionalCellSets.tree.map(lzn => filterNode(lzn, [], dragPath)).filter(Boolean),
    };

    // Update index values after temporarily removing the dragged node.
    // Names are unique as children of their parents.
    if (!dropNodeIsLevelZero) {
      dropNodeCurrIndex = dropParentNode.children.findIndex(c => c.name === dropNode.name);
    } else {
      dropNodeCurrIndex = nextAdditionalCellSets.tree.findIndex(
        lzn => lzn.name === dropNode.name,
      );
    }
    let newDragPath = [];
    if (!dropToGap || !dropNodeIsLevelZero) {
      let addChildFunction;
      let checkPathFunction;
      const newPath = [];
      if (!dropToGap) {
        // Append the dragNode to dropNode's children if dropping _onto_ the dropNode.
        // Set dragNode as the last child of dropNode.
        addChildFunction = n => nodeAppendChild(n, dragNode);
        checkPathFunction = path => isEqual(path, dropPath);
      } else if (!dropNodeIsLevelZero) {
        // Prepend or insert the dragNode if dropping _between_ (above or below dropNode).
        // The dropNode is at a level greater than zero,
        // so it has a parent.
        checkPathFunction = path => isEqual(path, dropParentPath);
        if (dropPosition === -1) {
          // Set dragNode as first child of dropParentNode.
          addChildFunction = n => nodePrependChild(n, dragNode);
        } else {
          // Set dragNode before or after dropNode.
          const insertIndex = dropNodeCurrIndex + (dropPosition > dropNodeCurrIndex ? 1 : 0);
          addChildFunction = n => nodeInsertChild(n, dragNode, insertIndex);
        }
      }
      nextAdditionalCellSets.tree = nextAdditionalCellSets.tree.map(
        node => nodeTransform(
          node,
          (n, path) => checkPathFunction(path),
          (n) => {
            const newNode = addChildFunction(n);
            return newNode;
          },
          newPath,
        ),
      );
      // Done
      setAdditionalCellSets(nextAdditionalCellSets);
      newDragPath = [...newPath[0], dragNode.name];
      setCellSetSelection([newDragPath]);
    } else if (dropPosition === -1) {
      // We need to drop the dragNode to level zero,
      // and level zero nodes do not have parents.
      // Set dragNode as first level zero node of the tree.
      nextAdditionalCellSets.tree.unshift(dragNode);
      setAdditionalCellSets(nextAdditionalCellSets);
      newDragPath = [dragNode.name];
      setCellSetSelection([newDragPath]);
    } else {
      // Set dragNode before or after dropNode in level zero.
      const insertIndex = dropNodeCurrIndex + (dropPosition > dropNodeCurrIndex ? 1 : 0);
      const newLevelZero = Array.from(nextAdditionalCellSets.tree);
      newLevelZero.splice(insertIndex, 0, dragNode);
      nextAdditionalCellSets.tree = newLevelZero;
      setAdditionalCellSets(nextAdditionalCellSets);
      newDragPath = [dragNode.name];
      setCellSetSelection([newDragPath]);
    }
    const oldColors = cellSetColor.filter(
      i => isEqualOrPrefix(dragPath, i.path),
    );
    const newColors = oldColors.map(
      i => (
        {
          ...i,
          path: !isEqual(i.path, dragPath)
            ? newDragPath.concat(i.path.slice(dragPath.length))
            : newDragPath,
        }
      ),
    );
    const newCellSetColor = cellSetColor.filter(
      i => !isEqualOrPrefix(dragPath, i.path),
    );
    newCellSetColor.push(...newColors);
    setCellSetColor(newCellSetColor);
  }, [additionalCellSets, cellSetColor, setAdditionalCellSets, setCellSetColor,
    setCellSetSelection,
  ]);

  // The user wants to change the color of a cell set node.
  const onNodeSetColor = useCallback((targetPath, color) => {
    // Replace the color if an array element for this path already exists.
    const prevNodeColor = cellSetColor?.find(d => isEqual(d.path, targetPath));
    if (!prevNodeColor) {
      setCellSetColor([
        ...(cellSetColor || []),
        {
          path: targetPath,
          color,
        },
      ]);
    } else {
      setCellSetColor([
        ...cellSetColor.filter(d => !isEqual(d.path, targetPath)),
        {
          path: targetPath,
          color,
        },
      ]);
    }
  }, [cellSetColor, setCellSetColor]);

  // The user wants to change the name of a cell set node.
  const onNodeSetName = useCallback((targetPath, name) => {
    const nextNamePath = [...targetPath];
    nextNamePath.pop();
    nextNamePath.push(name);

    const prevCellSetExpansion = cellSetExpansion || [];

    // Recursively check whether each node path
    // matches the path or a prefix of the path of the node to rename.
    // If so, rename the node using the new path.
    function renameNode(node, prevPath) {
      if (isEqual([...prevPath, node.name], targetPath)) {
        return {
          ...node,
          name,
        };
      }
      if (!node.children) {
        return node;
      }
      return {
        ...node,
        children: node.children.map(c => renameNode(c, [...prevPath, node.name])),
      };
    }
    const nextAdditionalCellSets = {
      ...additionalCellSets,
      tree: additionalCellSets.tree.map(lzn => renameNode(lzn, [])),
    };
    // Change all paths that have this node as a prefix (i.e. descendants).
    const nextCellSetColor = cellSetColor.map(d => ({
      path: tryRenamePath(targetPath, d.path, nextNamePath),
      color: d.color,
    }));
    const nextCellSetSelection = cellSetSelection.map(d => (
      tryRenamePath(targetPath, d, nextNamePath)
    ));
    const nextCellSetExpansion = prevCellSetExpansion.map(d => (
      tryRenamePath(targetPath, d, nextNamePath)
    ));
    // Need to update the node path everywhere it may be present.
    setAdditionalCellSets(nextAdditionalCellSets);
    setCellSetColor(nextCellSetColor);
    setCellSetSelection(nextCellSetSelection);
    setCellSetExpansion(nextCellSetExpansion);
  }, [additionalCellSets, cellSetColor, cellSetExpansion, cellSetSelection,
    setAdditionalCellSets, setCellSetColor, setCellSetSelection,
    setCellSetExpansion,
  ]);

  // Each time the user types while renaming a cell set node,
  // we need to check whether the potential new name conflicts
  // with any existing cell set node names.
  // If there are conflicts, we want to disable the "Save" button.
  const onNodeCheckNewName = useCallback((targetPath, name) => {
    const nextNamePath = [...targetPath];
    nextNamePath.pop();
    nextNamePath.push(name);
    const hasConflicts = (
      !isEqual(targetPath, nextNamePath)
      && treeFindNodeByNamePath(additionalCellSets, nextNamePath)
    );
    return hasConflicts;
  }, [additionalCellSets]);

  // The user wants to delete a cell set node, and has confirmed their choice.
  const onNodeRemove = useCallback((targetPath) => {
    const prevCellSetExpansion = cellSetExpansion || [];
    // Recursively check whether each node path
    // matches the path of the node to delete.
    // If so, return null, and then always use
    // .filter(Boolean) to eliminate any null array elements.
    const nextAdditionalCellSets = {
      ...additionalCellSets,
      tree: additionalCellSets.tree.map(lzn => filterNode(lzn, [], targetPath)).filter(Boolean),
    };
    // Delete state for all paths that have this node
    // path as a prefix (i.e. delete all descendents).
    const nextCellSetColor = cellSetColor.filter(d => !isEqualOrPrefix(targetPath, d.path));
    const nextCellSetSelection = cellSetSelection.filter(d => !isEqualOrPrefix(targetPath, d));
    const nextCellSetExpansion = prevCellSetExpansion.filter(d => !isEqualOrPrefix(targetPath, d));
    setAdditionalCellSets(nextAdditionalCellSets);
    setCellSetColor(nextCellSetColor);
    setCellSetSelection(nextCellSetSelection);
    setCellSetExpansion(nextCellSetExpansion);
  }, [additionalCellSets, cellSetColor, cellSetExpansion, cellSetSelection,
    setAdditionalCellSets, setCellSetColor, setCellSetSelection,
    setCellSetExpansion,
  ]);

  // The user wants to view (i.e. select) a particular node,
  // or its expanded descendents.
  const onNodeView = useCallback((targetPath) => {
    console.log('onNodeView', targetPath)
    // If parent node is clicked, and if it is expanded,
    // then select the expanded descendent nodes.
    const setsToView = [];
    // Recursively determine which descendent nodes are currently expanded.
    function viewNode(node, nodePath) {
      if (cellSetExpansion?.find(expandedPath => isEqual(nodePath, expandedPath))) {
        if (node.children) {
          node.children.forEach((c) => {
            viewNode(c, [...nodePath, c.name]);
          });
        } else {
          setsToView.push(nodePath);
        }
      } else {
        setsToView.push(nodePath);
      }
    }
    const targetNode = treeFindNodeByNamePath(mergedCellSets, targetPath);
    setSelectionPath(targetPath)
    viewNode(targetNode, targetPath);
    setCellSetSelection(setsToView);
    setCellSetColorEncoding();
  }, [cellSetExpansion, mergedCellSets, setCellSetColorEncoding, setCellSetSelection]);

  // The user wants to create a new level zero node.
  const onCreateLevelZeroNode = useCallback(() => {
    const nextName = getNextNumberedNodeName(additionalCellSets?.tree, 'My hierarchy ', '');
    setAdditionalCellSets({
      ...(additionalCellSets || treeInitialize(SETS_DATATYPE_OBS)),
      tree: [
        ...(additionalCellSets ? additionalCellSets.tree : []),
        {
          name: nextName,
          children: [],
        },
      ],
    });
  }, [additionalCellSets, setAdditionalCellSets]);

  // The user wants to create a new node corresponding to
  // the union of the selected sets.
  const onUnion = useCallback(() => {
    const newSet = treeToUnion(mergedCellSets, cellSetSelection);
    setObsSelection(
      newSet, additionalCellSets, cellSetColor,
      setCellSetSelection, setAdditionalCellSets, setCellSetColor,
      setCellColorEncoding,
      'Union ',
    );
  }, [additionalCellSets, cellSetColor, cellSetSelection, mergedCellSets,
    setAdditionalCellSets, setCellColorEncoding, setCellSetColor, setCellSetSelection,
  ]);

  // The user wants to create a new node corresponding to
  // the intersection of the selected sets.
  const onIntersection = useCallback(() => {
    const newSet = treeToIntersection(mergedCellSets, cellSetSelection);
    setObsSelection(
      newSet, additionalCellSets, cellSetColor,
      setCellSetSelection, setAdditionalCellSets, setCellSetColor,
      setCellColorEncoding,
      'Intersection ',
    );
  }, [additionalCellSets, cellSetColor, cellSetSelection, mergedCellSets,
    setAdditionalCellSets, setCellColorEncoding, setCellSetColor, setCellSetSelection,
  ]);

  // The user wants to create a new node corresponding to
  // the complement of the selected sets.
  const onComplement = useCallback(() => {
    const newSet = treeToComplement(mergedCellSets, cellSetSelection, allCellIds);
    setObsSelection(
      newSet, additionalCellSets, cellSetColor,
      setCellSetSelection, setAdditionalCellSets, setCellSetColor,
      setCellColorEncoding,
      'Complement ',
    );
  }, [additionalCellSets, allCellIds, cellSetColor, cellSetSelection,
    mergedCellSets, setAdditionalCellSets, setCellColorEncoding, setCellSetColor,
    setCellSetSelection,
  ]);

  // The user wants to import a cell set hierarchy,
  // probably from a CSV or JSON file.
  const onImportTree = useCallback((treeToImport) => {
    // Check for any naming conflicts with the current sets
    // (both user-defined and dataset-defined) before importing.
    const hasConflict = treesConflict(mergedCellSets, treeToImport);
    if (!hasConflict) {
      setAdditionalCellSets({
        ...(additionalCellSets || treeInitialize(SETS_DATATYPE_OBS)),
        tree: [
          ...(additionalCellSets ? additionalCellSets.tree : []),
          ...treeToImport.tree,
        ],
      });
      // Automatically initialize set colors for the imported sets.
      const importAutoSetColors = initializeCellSetColor(treeToImport, cellSetColor);
      setCellSetColor([
        ...cellSetColor,
        ...importAutoSetColors,
      ]);
    }
  }, [additionalCellSets, cellSetColor, mergedCellSets, setAdditionalCellSets,
    setCellSetColor,
  ]);

  // The user wants to download a particular hierarchy to a JSON file.
  const onExportLevelZeroNodeJSON = useCallback((nodePath) => {
    const {
      treeToExport, nodeName,
    } = treeExportLevelZeroNode(mergedCellSets, nodePath, SETS_DATATYPE_OBS, cellSetColor, theme);
    downloadForUser(
      handleExportJSON(treeToExport),
      `${nodeName}_${packageJson.name}-${SETS_DATATYPE_OBS}-hierarchy.${FILE_EXTENSION_JSON}`,
    );
  }, [cellSetColor, mergedCellSets, theme]);

  // The user wants to download a particular hierarchy to a CSV file.
  const onExportLevelZeroNodeTabular = useCallback((nodePath) => {
    const {
      treeToExport, nodeName,
    } = treeExportLevelZeroNode(mergedCellSets, nodePath, SETS_DATATYPE_OBS, cellSetColor, theme);
    downloadForUser(
      handleExportTabular(treeToExport),
      `${nodeName}_${packageJson.name}-${SETS_DATATYPE_OBS}-hierarchy.${FILE_EXTENSION_TABULAR}`,
    );
  }, [cellSetColor, mergedCellSets, theme]);

  // The user wants to download a particular set to a JSON file.
  const onExportSetJSON = useCallback((nodePath) => {
    const { setToExport, nodeName } = treeExportSet(mergedCellSets, nodePath);
    downloadForUser(
      handleExportJSON(setToExport),
      `${nodeName}_${packageJson.name}-${SETS_DATATYPE_OBS}-set.${FILE_EXTENSION_JSON}`,
      FILE_EXTENSION_JSON,
    );
  }, [mergedCellSets]);

  const manager = useMemo(() => (
    <SetsManager
      setColor={cellSetColor}
      sets={cellSets}
      additionalSets={additionalCellSets}
      levelSelection={checkedLevel}
      setSelection={cellSetSelection}
      setExpansion={cellSetExpansion}
      hasColorEncoding={cellColorEncoding === 'cellSetSelection'}
      draggable
      datatype={SETS_DATATYPE_OBS}
      onError={setWarning}
      onCheckNode={onCheckNode}
      onExpandNode={onExpandNode}
      onDropNode={onDropNode}
      onCheckLevel={onCheckLevel}
      onNodeSetColor={onNodeSetColor}
      onNodeSetName={onNodeSetName}
      onNodeCheckNewName={onNodeCheckNewName}
      onNodeRemove={onNodeRemove}
      onNodeView={onNodeView}
      onImportTree={onImportTree}
      onCreateLevelZeroNode={onCreateLevelZeroNode}
      onExportLevelZeroNodeJSON={onExportLevelZeroNodeJSON}
      onExportLevelZeroNodeTabular={onExportLevelZeroNodeTabular}
      onExportSetJSON={onExportSetJSON}
      onUnion={onUnion}
      onIntersection={onIntersection}
      onComplement={onComplement}
      hasCheckedSetsToUnion={cellSetSelection?.length > 1}
      hasCheckedSetsToIntersect={cellSetSelection?.length > 1}
      hasCheckedSetsToComplement={cellSetSelection?.length > 0}
      theme={theme}
      cellSetSelection={cellSetSelection}
    />
  ), [additionalCellSets, cellColorEncoding, cellSetColor, cellSetExpansion, cellSetSelection,
    cellSets, checkedLevel, onCheckLevel, onCheckNode, onComplement, onCreateLevelZeroNode,
    onDropNode, onExpandNode, onExportLevelZeroNodeJSON, onExportLevelZeroNodeTabular,
    onExportSetJSON, onImportTree, onIntersection, onNodeCheckNewName, onNodeRemove, onNodeSetColor,
    onNodeSetName, onNodeView, onUnion, setWarning, theme,
  ]);


  return (
    <TitleInfo
      title={title}
      isScroll
      closeButtonVisible={closeButtonVisible}
      downloadButtonVisible={downloadButtonVisible}
      removeGridComponent={removeGridComponent}
      urls={urls}
      theme={theme}
      isReady={isReady}
      helpText={helpText}
    >
      {manager}
    </TitleInfo>
  );
}
