import styled from 'styled-components';

export const FilterWrapper = styled.div`
  display: flex;
  flex-direction: row;
`;

export const Filter = styled.div`
  display: flex;
  flex-direction: column;
  margin: 1rem;

  > input {
    border-radius: 5px;
    padding: 0.3rem;
  }
`;

export const FilterListItem = styled.div`
  border-bottom: ${props => (props.hasBorder ? '1px solid lightgray' : 'none')};
`;

export const FilterListContainer = styled.div`
  border: 1px solid lightgray;
  border-radius: 5px;
`;

export const SelectedItems = styled.div`
  display: flex;

  > div {
    border-radius: 5px;
    display: flex;
    border-radius: 5px;
    padding: 0.3rem;
    background-color: lightgray;
    margin: 0.3rem 0.3rem 0 0;
  }
`;

export const TableWrapper = styled.div`
  font-size: 16px;
  > table {
    width: 100%;
  }
  > table > tr > th {
    margin: 1rem;
  }
  > table > tr > td {
    margin: 1rem;
  }
`;
