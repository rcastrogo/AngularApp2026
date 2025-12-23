import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ViewChild, TemplateRef } from '@angular/core';

import { TableComponent, Column, ActionHandlers, CellContext, ActionButton } from '~/components/app-table/app-table.component';
import { MSG_LOADING_BEGINS, MSG_LOADING_END } from '~/core/messages';
import { pubSub } from '~/core/pubsub';
import { accentNumericComparer, formatNumber } from '~/core/utils';
import { Country, CountriesService } from '~/services/api/countries.service';
import { TranslationService } from '~/services/translation.service';

@Component({
  selector: 'app-country-table',
  standalone: true,
  imports: [
    CommonModule,
    TableComponent
  ],
  template: `
    <div class="p-4 space-y-4">

      <input
        #searchBox
        (input)="fetchCountries(searchBox.value)"
        placeholder="Escribe el nombre de un país..."
        class="border p-2 w-full rounded"
      />

      <ng-template #flagCell let-row let-col="column">
        <div class="flex items-center p-px border rounded-2xl m-2">
          <img [src]="row.flag" class="w-full m-auto rounded-2xl min-h-14" alt="imagen de una bandera"/>
        </div>
      </ng-template>

      <app-table
        [key]="'countries'"
        [entity]="getEntityName()"
        [columns]="columns"
        [buttons]="buttons"
        [dataSource]="countries()"
        [waitingForRows]="isLoading()"
        [actionHandlers]="actions"
        [enableDoubleClickEdit]="false"
      />
    </div>
  `
})
export class CountryTableComponent implements OnInit {

  private i18n = inject(TranslationService);
  private countriesService = inject(CountriesService);

  countries = signal<Country[]>([]);
  isLoading = signal(false);

  columns: Column<Country>[] = [];
  actions: ActionHandlers<Country> = {};
  buttons: ActionButton[] = [];

  @ViewChild('flagCell', { static: true })
  flagCell!: TemplateRef<CellContext<Country>>;

  btnExport: ActionButton = {
    key: 'export',
    label: { key: 'general.action.export' },
    icon: 'download',
    show: 'menu',
    enabledWhen: selected => selected.size > 0,
    onClick: () => alert('onclick Export')
  };

  btnSearch: ActionButton = {
    key: 'search',
    label: { key: 'general.action.search' },
    icon: 'search',
    onClick: () => alert('Buscar')
  };

  btnSettings: ActionButton = {
    key: 'settings',
    label: 'Config',
    icon: 'settings',
    show: 'menu',
    enabledWhen: selected => selected.size == 1,
    onClick: () => alert('onclick Config')
  };

  async ngOnInit() {
    this.columns = this.createColumns();
    this.buttons = [
      this.btnSearch,
      this.btnExport, 
      this.btnSettings
    ];
    this.actions.onCreate = this.handleCreate;
    this.actions.onDelete = this.handleDelete;
    this.actions.onEdit = this.handleEdit;
    this.actions.onCustomAction = this.handleCustomAction;

    await this.fetchCountries();
  }

  fetchCountries = async (term = '') => {

    this.isLoading.set(true);
    pubSub.publish(MSG_LOADING_BEGINS);

    const response = term.length > 2
      ? await this.countriesService.searchByName(term)
      : await this.countriesService.getAll();

    this.isLoading.set(false);
    pubSub.publish(MSG_LOADING_END);

    if (typeof response !== 'string') {
      this.countries.set(response.data || []);
    }
  }

  private createColumns = () : Column<Country>[] =>  {
    return [
      {
        key: 'id',
        title: 'Id',
        className: 'w-12 text-center ',
        sorter: 'id'
      },
      {
        key: 'Id x 2',
        title: 'Id x 2',
        className: 'w-24 text-center',
        // map: (id) => `${id} x 2 = ${id * 2}`,
        accessor: (c) => `${c.id * 2}`,
        sorter: (a, b) => a.id - b.id
      },
      {
        key: 'name',
        title: { key: 'country-table.columns.name' },
        accessor: 'name',
        sorter: (a, b) => accentNumericComparer(a.name, b.name),
      },
      {
        key: 'capital',
        title: { key: 'country-table.columns.capital' },
        accessor: (p) => p.capital,
        sorter: (a, b) => accentNumericComparer(a.capital, b.capital),
      },
      {
        key: 'region',
        title: { key: 'country-table.columns.region' },
        sorter: (a, b) => accentNumericComparer(a.region, b.region),
      },
      {
        key: 'population',
        title: { key: 'country-table.columns.population' },
        accessor: (p) => formatNumber(p.population, this.i18n.getLang()),
        className: 'w-8 text-right ',
        sorter: (a, b) => a.population - b.population,
        hideValueSelection: true,
      },
      {
        key: 'flag',
        title: { key: 'country-table.columns.flag' },
        className: 'w-30 text-center',
        cellTemplate: this.flagCell,
        hideSeachButton:true,
      }
    ];
  }


  private handleCreate: ActionHandlers<Country>['onCreate'] = (done) => {
    alert('handleCreate');
    const newCountry: Country = {
      id: Date.now(),
      name: 'Nuevo País',
      capital: 'Capital X',
      region: 'Región Y',
      population: 0,
      flag: '',
      cca2: '',
      data: {},
    };
    this.countries.update(list => [...list, newCountry]);
    done(newCountry);
  };

  private handleDelete: ActionHandlers<Country>['onDelete'] = (ids, done) => {
    alert('handleDelete');
    this.countries.update(list =>
      list.filter(c => !ids.includes(c.id))
    );
    done();
  };

  private handleEdit: ActionHandlers<Country>['onEdit'] = (country, done) => {
    alert('handleEdit');
    const updated: Country = {
      ...country,
      name: country.name + ' (editado)'
    };

    this.countries.update(list =>
      list.map(c => c.id === country.id ? updated : c)
    );

    done(updated);
  };

  private handleCustomAction: ActionHandlers<Country>['onCustomAction'] = (action) => {
    if (action === 'reload') {
      this.fetchCountries();
    }
    alert('handleCustomAction: ' + action);
  };

  getEntityName = () => this.i18n.t('country-table.entity-name');

}
