/*
 * SPDX-FileCopyrightText: 2022 CERN.
 * SPDX-License-Identifier: MIT
 */

import PropTypes from "prop-types";
import { i18next } from "@translations/invenio_administration/i18next";
import { Button, Popup, Icon } from "semantic-ui-react";
import Overridable from "react-overridable";

const EditCmp = ({
  display = true,
  editUrl,
  disable = () => false,
  disabledMessage = i18next.t("Resource is not editable."),
  resource = undefined,
}) => {
  if (!display) {
    return null;
  }
  const disabled = disable(resource);

  return (
    <Popup
      content={disabledMessage}
      disabled={!disabled}
      trigger={
        <Button as="a" disabled={disabled} href={editUrl} icon labelPosition="left">
          <Icon name="pencil" />
          {i18next.t("Edit")}
        </Button>
      }
    />
  );
};

EditCmp.propTypes = {
  display: PropTypes.bool,
  editUrl: PropTypes.string.isRequired,
  disable: PropTypes.func,
  disabledMessage: PropTypes.string,
  resource: PropTypes.object,
};

export default Overridable.component("InvenioAdministration.EditAction", EditCmp);
