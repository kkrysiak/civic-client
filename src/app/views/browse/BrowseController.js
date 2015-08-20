(function() {
  'use strict';
  angular.module('civic.browse')
    .controller('BrowseController', BrowseController);

// @ngInject
  function BrowseController($scope,
                            $state,
                            uiGridConstants,
                            Datatables,
                            _) {
    console.log('BrowseController called.');
    var vm = $scope.vm = {};

    var pageCount = 1000;

    var defaults = {};

    defaults.variants  = {
      mode: 'variants',
      page: 1,
      count: pageCount,
      sorting: [{field: 'variant', direction: uiGridConstants.ASC }],
      filters: []
    };

    defaults.genes = {
      mode: 'genes',
      page: 1,
      count: pageCount,
      sorting: [{field: 'name', direction: uiGridConstants.ASC }],
      filters: []
    };

    // set up column defs and data transforms for each mode
    var modeColumnDefs = {
      'variants': [
        {
          name: 'variant',
          width: '30%',
          sort: {direction: uiGridConstants.ASC},
          enableFiltering: true,
          allowCellFocus: false,
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          }
        },
        {
          name: 'entrez_gene',
          width: '15%',
          enableFiltering: true,
          allowCellFocus: false,
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          }
        },
        {
          name: 'diseases',
          displayName: 'Diseases',
          width: '45%',
          enableFiltering: true,
          allowCellFocus: false,
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          },
          cellTemplate: 'app/views/browse/browseGridTooltipCell.tpl.html'
        },
        {
          name: 'evidence_item_count',
          width: '10%',
          displayName: 'Evidence',
          enableFiltering: true,
          allowCellFocus: false,
          filter: {
            condition: uiGridConstants.filter.GREATER_THAN_OR_EQUAL
          }
        }
      ],
      'genes': [
        {
          name: 'name',
          width: '15%',
          sort: {direction: uiGridConstants.ASC},
          enableFiltering: true,
          allowCellFocus: false,
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          }
        },
        {
          name: 'gene_aliases',
          width: '30%',
          displayName: 'Gene Aliases',
          enableFiltering: true,
          allowCellFocus: false,
          cellTemplate: 'app/views/browse/browseGridTooltipCell.tpl.html',
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          }
        },
        {
          name: 'diseases',
          width: '30%',
          displayName: 'Diseases',
          enableFiltering: true,
          allowCellFocus: false,
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          },
          cellTemplate: 'app/views/browse/browseGridTooltipCell.tpl.html'
        },
        {
          name: 'variant_count',
          displayName: 'Variants',
          width: '10%',
          enableFiltering: false,
          allowCellFocus: false,
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          }
        },
        {
          name: 'evidence_item_count',
          width: '10%',
          displayName: 'Evidence',
          enableFiltering: false,
          allowCellFocus: false,
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          }
        }
      ]
    };

    vm.gridOptions = {
      //infiniteScrollRowsFromEnd: 40,
      //infiniteScrollUp: true,
      //infiniteScrollDown: true,
      useExternalFiltering: false,
      useExternalSorting: false,

      enableFiltering: true,
      enableColumnMenus: false,
      enableSorting: true,
      enableRowSelection: true,
      enableRowHeaderSelection: false,
      multiSelect: false,
      modifierKeysToMultiSelect: false,
      noUnselect: true,
      minRowsToShow: 25,
      rowTemplate: 'app/views/browse/browseGridRow.tpl.html',
      columnDefs: modeColumnDefs[vm.mode],
      data: 'vm.data'
    };

    vm.data = [];

    vm.gridOptions.onRegisterApi = function(gridApi) {
      vm.gridApi = gridApi;

      fetchData(vm.mode, pageCount, 1, [], [])
        .then(function(response) {
          console.log('datatables returned');
          vm.data = response.result;
        })
        .catch(function(error) {
          console.error('fetchData error: ' + error);
        })
        .finally(function() {
          console.log('fetchData done.');
        });

      // called when user clicks on a row
      gridApi.selection.on.rowSelectionChanged($scope, function(row){
        if(vm.mode === 'variants') {
          $state.go('events.genes.summary.variants.summary', {
            geneId: row.entity.gene_id,
            variantId: row.entity.variant_id
          });
        } else {
          $state.go('events.genes.summary', {
            geneId: row.entity.id
          });
        }
      });

    };

    function updateData() {
      fetchData(vm.mode, vm.count, vm.page, vm.sorting, vm.filters)
        .then(function(data){
          vm.gridOptions.data = data.result;
        });
    }

    vm.switchMode = function(mode) {
      vm.mode = mode;
      vm.count = defaults[mode].count;
      vm.filters = defaults[mode].filters;
      vm.sorting= defaults[mode].sorting;
      vm.page = defaults[mode].page;
      vm.gridOptions.columnDefs = modeColumnDefs[vm.mode];
      updateData();
    };

    function fetchData(mode, count, page, sorting, filters) {
      var request;

      request = {
        mode: mode,
        count: count,
        page: page
      };

      if (filters.length > 0) {
        _.each(filters, function(filter) {
          request['filter[' + filter.field + ']'] = filter.term;
        });
      }

      if (sorting.length > 0) {
        _.each(sorting, function(sort) {
          request['sorting[' + sort.field + ']'] = sort.direction;
        });
      }
      return Datatables.query(request);
    }

    vm.switchMode('variants');
  }
})();
