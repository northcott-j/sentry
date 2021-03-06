import PropTypes from 'prop-types';
import React from 'react';
import styled from '@emotion/styled';
import {withRouter} from 'react-router';
import {WithRouterProps} from 'react-router/lib/withRouter';

import {Organization} from 'app/types';
import SentryTypes from 'app/sentryTypes';
import GlobalSelectionLink from 'app/components/globalSelectionLink';
import Link from 'app/components/links/link';
import Tooltip from 'app/components/tooltip';
import {IconCopy} from 'app/icons';
import Clipboard from 'app/components/clipboard';
import overflowEllipsis from 'app/styles/overflowEllipsis';
import space from 'app/styles/space';
import {formatVersion} from 'app/utils/formatters';
import withOrganization from 'app/utils/withOrganization';

type Props = {
  /**
   * Raw version (canonical release identifier)
   */
  version: string;
  /**
   *  Organization injected by withOrganization HOC
   */
  organization: Organization;
  /**
   * Should the version be a link to the release page
   */
  anchor?: boolean;
  /**
   * Should link to release page preserve user's global selection values
   */
  preserveGlobalSelection?: boolean;
  /**
   * Should there be a tooltip with raw version on hover
   */
  tooltipRawVersion?: boolean;
  /**
   * Should we also show package name
   */
  withPackage?: boolean;
  /**
   * Will add project ID to the linked url (can be overriden by preserveGlobalSelection).
   * If not provided and user does not have global-views enabled, it will try to take it from current url query.
   */
  projectId?: string;
  /**
   * Ellipsis on overflow
   */
  truncate?: boolean;
  className?: string;
};

const Version = ({
  version,
  organization,
  anchor = true,
  preserveGlobalSelection,
  tooltipRawVersion,
  withPackage,
  projectId,
  truncate,
  className,
  location,
}: WithRouterProps & Props) => {
  const LinkComponent = preserveGlobalSelection ? GlobalSelectionLink : Link;
  const versionToDisplay = formatVersion(version, withPackage);

  let releaseDetailProjectId: null | undefined | string | string[];
  if (!preserveGlobalSelection) {
    if (projectId) {
      // if user specifically sets projectId and not preserveGlobalSelection, use that
      releaseDetailProjectId = projectId;
    } else if (!new Set(organization.features).has('global-views')) {
      // we need this for users without global-views, otherwise they might get `This release may not be in your selected project`
      releaseDetailProjectId = location.query.project;
    }
  }

  const renderVersion = () => {
    if (anchor && organization.slug) {
      return (
        <LinkComponent
          to={{
            pathname: `/organizations/${organization.slug}/releases/${encodeURIComponent(
              version
            )}/`,
            query: releaseDetailProjectId ? {project: releaseDetailProjectId} : undefined,
          }}
          className={className}
        >
          <VersionText truncate={truncate}>{versionToDisplay}</VersionText>
        </LinkComponent>
      );
    }

    return (
      <VersionText className={className} truncate={truncate}>
        {versionToDisplay}
      </VersionText>
    );
  };

  const renderTooltipContent = () => {
    return (
      <TooltipContent
        onClick={e => {
          e.stopPropagation();
        }}
      >
        <TooltipVersionWrapper>{version}</TooltipVersionWrapper>

        <Clipboard value={version}>
          <TooltipClipboardIconWrapper>
            <IconCopy size="xs" color="white" />
          </TooltipClipboardIconWrapper>
        </Clipboard>
      </TooltipContent>
    );
  };

  return (
    <Tooltip
      title={renderTooltipContent()}
      disabled={!tooltipRawVersion}
      isHoverable
      containerDisplayMode={truncate ? 'block' : 'inline-block'}
    >
      {renderVersion()}
    </Tooltip>
  );
};

Version.propTypes = {
  version: PropTypes.string.isRequired,
  organization: SentryTypes.Organization.isRequired,
  anchor: PropTypes.bool,
  preserveGlobalSelection: PropTypes.bool,
  tooltipRawVersion: PropTypes.bool,
  withPackage: PropTypes.bool,
  projectId: PropTypes.string,
  truncate: PropTypes.bool,
  className: PropTypes.string,
};

const VersionText = styled('span')<{truncate?: boolean}>`
  ${p =>
    p.truncate &&
    `max-width: 100%;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;`}
`;

const TooltipContent = styled('span')`
  display: flex;
  align-items: center;
`;

const TooltipVersionWrapper = styled('span')`
  ${overflowEllipsis}
`;

const TooltipClipboardIconWrapper = styled('span')`
  margin-left: ${space(0.5)};
  position: relative;
  bottom: -${space(0.25)};

  &:hover {
    cursor: pointer;
  }
`;

type PropsWithoutOrg = Omit<Props, 'organization'>;

export default withOrganization(withRouter(Version)) as React.ComponentClass<
  PropsWithoutOrg
>;
