import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { Button, Modal, Icon } from "semantic-ui-react";
import { ActionForm } from "../formik";
import ActionModal from "./ActionModal";
import _get from "lodash/get";
import _isEmpty from "lodash/isEmpty";
import Overridable from "react-overridable";
import { InvenioAdministrationActionsApi } from "../api";

class ResourceActions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      modalOpen: false,
      modalHeader: undefined,
      modalBody: undefined,
    };
  }

  onModalTriggerClick = (
    e,
    { payloadSchema, dataName, dataActionKey, dataSubmitButtonText }
  ) => {
    const { resource } = this.props;
    this.setState({
      modalOpen: true,
      modalHeader: dataName,
      modalBody: (
        <ActionForm
          actionKey={dataActionKey}
          actionSchema={payloadSchema}
          actionSuccessCallback={this.onModalClose}
          actionCancelCallback={this.closeModal}
          resource={resource}
          submitButtonText={dataSubmitButtonText}
        />
      ),
    });
  };

  onActionSubmit = async (e, { dataActionKey, ...rest }) => {
    // TODO: Taken from ActionForm - needs refactoring/merge
    console.log({ rest });
    this.setState({ loading: true });
    const actionEndpoint = this.getEndpoint(dataActionKey);

    try {
      const response = await InvenioAdministrationActionsApi.resourceAction(
        actionEndpoint
      );
      // this.setState({ loading: false, success: response.data });
      this.onModalClose(response.data);
    } catch (e) {
      console.error(e);
      this.setState({ loading: false });
    }
  };

  getEndpoint = (actionKey) => {
    // TODO: Taken from ActionForm - needs refactoring/merge
    const { resource } = this.props;
    let endpoint;
    // get the action endpoint from the current resource links
    endpoint = _get(resource, `links.actions[${actionKey}]`);

    // endpoint can be also within links, not links.action
    // TODO: handle it in a nicer way
    if (_isEmpty(endpoint)) {
      endpoint = _get(resource, `links[${actionKey}]`);
    }
    if (!endpoint) {
      console.error("Action endpoint not found in the resource!");
    }
    return endpoint;
  };

  closeModal = () => {
    this.setState({
      modalOpen: false,
      modalHeader: undefined,
      modalBody: undefined,
    });
  };

  onModalClose = () => {
    const { successCallback } = this.props;
    this.setState({
      modalOpen: false,
      modalHeader: undefined,
      modalBody: undefined,
    });
    successCallback();
  };

  render() {
    const { actions, Element, resource } = this.props;
    const { modalOpen, modalHeader, modalBody, loading } = this.state;
    return (
      <>
        {Object.entries(actions).map(([actionKey, actionConfig]) => {
          console.log({ actionConfig });
          return (
            <Element
              key={actionKey}
              onClick={
                !actionConfig.payload_schema
                  ? this.onModalTriggerClick
                  : this.onActionSubmit
              }
              payloadSchema={actionConfig.payload_schema}
              dataName={actionConfig.text}
              dataSubmitButtonText={actionConfig.submit_button_text}
              dataActionKey={actionKey}
              loading={loading}
              disabled={loading}
              icon
              labelPosition="left"
            >
              <Icon name="cog" />
              {actionConfig.text}
            </Element>
          );
        })}
        <ActionModal modalOpen={modalOpen} resource={resource}>
          {modalHeader && <Modal.Header>{modalHeader}</Modal.Header>}
          {!_isEmpty(modalBody) && modalBody}
        </ActionModal>
      </>
    );
  }
}

ResourceActions.propTypes = {
  resource: PropTypes.object.isRequired,
  successCallback: PropTypes.func.isRequired,
  actions: PropTypes.shape({
    text: PropTypes.string.isRequired,
    payload_schema: PropTypes.object.isRequired,
    submit_button_text: PropTypes.string,
    order: PropTypes.number.isRequired,
  }),
  Element: PropTypes.node,
};

ResourceActions.defaultProps = {
  Element: Button,
  actions: undefined,
};

export default Overridable.component(
  "InvenioAdministration.ResourceActions",
  ResourceActions
);
