/* eslint-disable no-restricted-syntax */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { readString } from 'react-papaparse';
import moment from 'moment';
import csvFile from '../../assets/price_detail.csv';
import {
  Filter,
  FilterListContainer,
  FilterListItem,
  FilterWrapper,
  SelectedItems,
  TableWrapper,
} from './styled';

const maxDate = moment().add(1000, 'years');

const useDebounce = (effect, dependencies, delay) => {
  const callback = useCallback(effect, dependencies);

  useEffect(() => {
    const timeout = setTimeout(callback, delay);
    return () => clearTimeout(timeout);
  }, [callback, delay]);
};

export const HomePage = () => {
  const [csvData, setCsvData] = useState();
  const [filteredData, setFilteredData] = useState();
  const [filteredProductIds, setFilteredProductIds] = useState([]);
  const [productIdSearch, setProductIdSearch] = useState();
  const [marketSearch, setMarketSearch] = useState();
  const [filteredMarkets, setFilteredMarkets] = useState([]);
  const [selected, setSelected] = useState({ markets: [], productIds: [] });
  const [showMarkets, setShowMarkets] = useState(false);
  const [showProductIds, setShowProductIds] = useState(false);
  const params = useParams();

  useEffect(() => {
    const papaConfig = {
      header: true,
      complete: results => {
        const productIds = [
          ...new Set(results.data.map(x => x.CatalogEntryCode)),
        ];
        const markets = [...new Set(results.data.map(x => x.MarketId))];
        setCsvData({
          data: results.data,
          temp: results.data.filter(x => !x.ValidFrom),
          productIds,
          markets,
        });
      },
      download: true,
      error: (error, file) => {
        console.log('Error while parsing:', error, file);
      },
    };
    readString(csvFile, papaConfig);
    const tempSelected = { ...selected };
    if (params.productId) {
      tempSelected.productIds.push(params.productId.toLowerCase());
    }
    if (params.market) {
      tempSelected.markets.push(params.market.toLowerCase());
    }
    if (tempSelected.markets.length > 0 || tempSelected.productIds.length > 0) {
      setSelected(tempSelected);
    }
  }, []);

  useEffect(() => {
    if (csvData) {
      const data = [];
      for (const productId of selected.productIds) {
        for (const market of selected.markets) {
          const filtered = csvData.data
            .filter(x => {
              if (x.CatalogEntryCode && x.MarketId) {
                return (
                  productId.toLowerCase() ===
                    x.CatalogEntryCode.toLowerCase() &&
                  market.toLowerCase() === x.MarketId.toLowerCase()
                );
              }
              return false;
            })
            .map(y => ({
              ...y,
              ValidFrom: moment(y.ValidFrom).format('YYYY-MM-DD'),
              ValidUntil: !moment(y.ValidUntil).isValid()
                ? maxDate.format('YYYY-MM-DD')
                : moment(y.ValidUntil).format('YYYY-MM-DD'),
              HasNoEnd: !moment(y.ValidUntil).isValid(),
            }));

          const timeline = [
            ...new Set(
              filtered
                .map(x => [x.ValidFrom, x.ValidUntil])
                .flat()
                .sort(
                  (a, b) =>
                    moment(a).format('YYYYMMDD') - moment(b).format('YYYYMMDD'),
                ),
            ),
          ];
          const retVal = [];
          let prevPrice = null;
          let index = 0;
          // eslint-disable-next-line no-loop-func
          for (const date of timeline) {
            const pricesForDate = filtered
              .filter(
                x =>
                  moment(date).isBetween(x.ValidFrom, x.ValidUntil) ||
                  moment(date).isSame(x.ValidFrom),
              )
              .sort((a, b) => a.UnitPrice - b.UnitPrice);
            const temp = { ...pricesForDate[0] };

            temp.UnitPrice = parseFloat(temp.UnitPrice).toFixed(2);

            if (index > 0) {
              retVal[index - 1].ValidUntil = maxDate.isSame(date, 'day')
                ? null
                : date;
            }

            if (pricesForDate.length > 0 && temp.UnitPrice !== prevPrice) {
              prevPrice = temp.UnitPrice;
              temp.ValidFrom = date;
              prevPrice = temp.UnitPrice;
              index += 1;
              retVal.push(temp);
            }
          }
          data.push(retVal);
        }
      }
      setFilteredData({
        data: data.flat(),
      });
    }
  }, [csvData, selected]);

  useDebounce(
    () => {
      if (csvData) {
        let filtered = csvData.productIds.filter(id => {
          if (!id || selected.productIds.includes(id)) {
            return false;
          }
          return id.includes(productIdSearch);
        });

        if (filtered.length > 5) {
          filtered = filtered.slice(0, 5);
        }

        setFilteredProductIds(filtered);
      }
    },
    [productIdSearch],
    500,
  );

  useDebounce(
    () => {
      if (csvData) {
        let filtered = csvData.markets.filter(market => {
          if (!market || selected.markets.includes(market)) {
            return false;
          }
          return market.includes(marketSearch);
        });

        if (filtered.length > 5) {
          filtered = filtered.slice(0, 5);
        }

        setFilteredMarkets(filtered);
      }
    },
    [marketSearch],
    500,
  );

  const onFilterAdd = (value, type) => {
    const currentFilter = { ...selected }[type];
    currentFilter.push(value.toLowerCase());
    setSelected({ ...selected, [type]: currentFilter });
  };

  const onFilterRemove = (value, type) => {
    const currentFilter = { ...selected }[type];
    const index = currentFilter.indexOf(value.toLowerCase());
    if (index > -1) currentFilter.splice(index, 1);
    setSelected({ ...selected, [type]: currentFilter });
  };

  return (
    <div>
      <FilterWrapper>
        <Filter>
          <input
            onFocus={() => setShowProductIds(true)}
            type="text"
            onChange={e => setProductIdSearch(e.target.value)}
            placeholder="Search product ids"
          />
          {showProductIds && (
            <FilterListContainer>
              {filteredProductIds.length > 0 ? (
                filteredProductIds.map((id, i) => (
                  <FilterListItem
                    key={id}
                    hasBorder={i !== filteredProductIds.length - 1}
                    onClick={() => {
                      setShowProductIds(false);
                      setProductIdSearch();
                      onFilterAdd(id, 'productIds');
                    }}
                  >
                    {id}
                  </FilterListItem>
                ))
              ) : (
                <FilterListItem hasBorder={false}>
                  Inga sökresultat
                </FilterListItem>
              )}
            </FilterListContainer>
          )}
          <SelectedItems>
            {selected.productIds.map(p => (
              <div key={p} onClick={() => onFilterRemove(p, 'productIds')}>
                {p}
              </div>
            ))}
          </SelectedItems>
        </Filter>
        {filteredData && (
          <Filter>
            <input
              onFocus={() => setShowMarkets(true)}
              type="text"
              onChange={e => setMarketSearch(e.target.value)}
              placeholder="Search markets"
            />
            {showMarkets && (
              <FilterListContainer>
                {filteredMarkets.length > 0 &&
                  filteredMarkets.map((market, i) => (
                    <FilterListItem
                      key={market}
                      hasBorder={i !== filteredMarkets.length - 1}
                      onClick={() => {
                        setShowMarkets(false);
                        setMarketSearch();
                        onFilterAdd(market, 'markets');
                      }}
                    >
                      {market}
                    </FilterListItem>
                  ))}
              </FilterListContainer>
            )}
            <SelectedItems>
              {selected.markets.map(m => (
                <div key={m} onClick={() => onFilterRemove(m, 'markets')}>
                  {m}
                </div>
              ))}
            </SelectedItems>
          </Filter>
        )}
      </FilterWrapper>
      <TableWrapper>
        <table>
          <thead>
            <tr>
              <th align="left">Katalog id</th>
              <th align="left">Marknad</th>
              <th align="left">Pris</th>
              <th align="left">Valuta</th>
              <th align="left">Start och slut</th>
            </tr>
          </thead>

          <tbody>
            {filteredData &&
              filteredData.data.map((d, index) => (
                <tr
                  style={{
                    backgroundColor: index % 2 === 1 ? 'white' : 'lightgray',
                  }}
                  key={`${d.PriceValueId}${d.ValidFrom}`}
                >
                  <td>{d.CatalogEntryCode}</td>
                  <td>{d.MarketId}</td>
                  <td>{d.UnitPrice}</td>
                  <td>{d.CurrencyCode}</td>
                  <td>
                    {d.ValidFrom} — {d.ValidUntil}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  );
};

HomePage.propTypes = {};

export default HomePage;
