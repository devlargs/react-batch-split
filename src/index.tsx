import React, { cloneElement, ReactElement } from "react";
import { useQuery } from "@apollo/react-hooks";
import { Spin, Tooltip } from "antd";
import { DocumentNode } from "graphql";
import { WarningOutlined } from "@ant-design/icons";

const get = (obj: any, path: string, defaultValue?: any): any => {
  const travel = (regexp: any): any =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce(
        (res: any, key: any): any =>
          res !== null && res !== undefined ? res[key] : res,
        obj
      );
  const result: any = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
};

const isEmpty = (obj: any): any =>
  [Object, Array].includes((obj || {}).constructor) &&
  !Object.entries(obj || {}).length;

type Props = {
  gqlTag: DocumentNode;
  render: string;
  component?: ReactElement;
  id?: string;
  restProps?: any;
  dynamicProps?: any;
  defaultValue?: number | string | ReactElement;
  withEdges?: boolean;
  customFilter?: any;
  manipulate?: Function;
  fetchPolicy?: any;
};
const BatchSplit = ({
  component,
  gqlTag,
  id,
  render,
  restProps = {},
  dynamicProps = {},
  defaultValue = "-",
  withEdges = false,
  customFilter = {},
  manipulate,
  fetchPolicy,
}: Props) => {
  const tempDynamicProps: any = {};
  let filter = {};

  if (id) {
    filter = {
      filter: { id: { eq: id } },
    };
  }
  const { data, loading, error } = useQuery(gqlTag, {
    context: { shouldBatch: true },
    fetchPolicy: fetchPolicy || "cache-and-network",
    variables: {
      ...filter,
      ...customFilter,
    },
  });

  if (loading) {
    return <Spin spinning={loading} />;
  }

  if (error as any) {
    return (
      <Tooltip
        title={error?.message || "API did not resolve"}
        style={{ zIndex: 99 }}
      >
        <WarningOutlined />
      </Tooltip>
    );
  }

  const temp = get(
    data,
    withEdges
      ? `${data ? Object.keys(data)[0] : ""}.edges`
      : `${data ? Object.keys(data) : ""}`,
    withEdges ? [] : {}
  );

  if (!isEmpty(dynamicProps)) {
    Object.keys(dynamicProps).map((q) => {
      if (withEdges) {
        tempDynamicProps[q] =
          temp.length === 1 ? get(temp[0], dynamicProps[q], "-") : "-";
        return null;
      } else {
        tempDynamicProps[q] = !isEmpty(temp)
          ? get(temp, dynamicProps[q], "-")
          : "-";
      }
      return null;
    });
  }

  const children = () => {
    if (withEdges) {
      return temp.length === 1
        ? get(temp[0], render, defaultValue)
        : defaultValue;
    } else {
      return !isEmpty(temp) ? get(temp, render, defaultValue) : defaultValue;
    }
  };

  return cloneElement(
    component || <></>,
    { ...restProps, ...tempDynamicProps },
    manipulate ? manipulate(children()) : children()
  );
};

export default BatchSplit;
