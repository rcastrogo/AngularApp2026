import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ViewChild, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { literals } from '~/components/app-alert/app-alert.component';
import { TableComponent, Column, ActionHandlers, CellContext, ActionButton } from '~/components/app-table/app-table.component';
import { MSG_LOADING_BEGINS, MSG_LOADING_END } from '~/core/messages';
import { pubSub } from '~/core/pubsub';
import { accentNumericComparer, formatNumber } from '~/core/utils';
import { AlertService } from '~/services/alert.service';
import { Country, CountriesService } from '~/services/api/countries.service';
import { NotificationService } from '~/services/notification.service';
import { TranslationService } from '~/services/translation.service';

interface ExportItem {
  id: string | number;
  name: string;
  notes: string;
}

@Component({
  selector: 'app-country-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableComponent,
],
  template: `
    <ng-template #flagCell let-row let-col="column">
      <div class="flex items-center p-px border rounded-2xl m-2">
        <img [src]="row.flag" class="w-full m-auto rounded-2xl min-h-14" alt="imagen de una bandera"/>
      </div>
    </ng-template>
    <ng-template #export_template let-items="items">
      <div class="space-y-3 w-full max-h-96 overflow-auto">
        @for (item of items; track item.id) {
          <div class="border rounded p-3 space-y-1">
            <div class="font-medium">
              {{ item.name }}
            </div>
            <textarea
              [(ngModel)]="item.notes"
              rows="2"
              class="w-full border rounded p-2 text-sm"
              placeholder="Observaciones…"
            ></textarea>
          </div>
        }

      </div>
    </ng-template>
    <div class="p-4 space-y-4">

      <input
        #searchBox
        (input)="fetchCountries(searchBox.value)"
        placeholder="Escribe el nombre de un país..."
        class="border p-2 w-full rounded"
      />

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
  alert = inject(AlertService);
  notifications = inject(NotificationService);
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
    // onClick: () => this.alert.showInfo('onclick Export', { title: this.getEntityName() })
  };

  btnSearch: ActionButton = {
    key: 'search',
    label: { key: 'general.action.search' },
    icon: 'search',
    onClick: () => this.notifications.info('Buscar')
  };

  btnSettings: ActionButton = {
    key: 'settings',
    label: 'Config',
    icon: 'settings',
    show: 'menu',
    enabledWhen: selected => selected.size == 1,
    onClick: () => this.alert.showInfo('onclick Config', { title: this.getEntityName() })
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

  private _id = 10000;
  private handleCreate: ActionHandlers<Country>['onCreate'] = (done) => {

    const __action = () => {
      const newCountry: Country = {
        id: this._id++,
        name: 'Nuevo País',
        capital: 'Capital X',
        region: 'Región Y',
        population: 0,
        flag: '',
        cca2: '',
        data: {},
      };
      done(newCountry);
    }

    this.alert.showInfo(
      'handleCreate', 
      { 
        title: this.getEntityName(),
        autoCloseMs: 1500,
        onClose: __action,
      });
  };
  private handleDelete: ActionHandlers<Country>['onDelete'] = (ids, done) => {
    const __action = () => {
      pubSub.publish(MSG_LOADING_BEGINS);

      this.alert.showLoading(this.i18n.t('country-table.deleting'));
      setTimeout(() => {
        pubSub.publish(MSG_LOADING_END);
        this.alert.close();
        this.notifications.success('País eliminado correctamente')
        done();    
      }, 3000);
    }
    const message = '¿Está seguro de eliminar los elementos seleccionados?';
    const options = {
        title: this.getEntityName(),
        showConfirmButton: true,
        literals: literals.noYes,
        onConfirm: __action
    }
    this.alert.showQuestion(message, options);
  };

  private handleEdit: ActionHandlers<Country>['onEdit'] = (country, done) => {
    this.alert.showInfo('handleEdit', { title: this.getEntityName() });
    const updated: Country = {
      ...country,
      name: country.name + ' (editado)'
    };

    done(updated);
  };

  private handleCustomAction: ActionHandlers<Country>['onCustomAction'] = (action, data) => {    
    if (action === 'reload') {
      this.fetchCountries();
    }
    else if (action === 'export') {
      this.handleExport(data);
      return;
    }
    
    this.alert.showInfo('handleCustomAction: ' + action, { title: this.getEntityName() });
  };

  // =======================================================================================
  // Ejemplo de implementación de dialogo modal
  // =======================================================================================
  exportItems = signal<ExportItem[]>([]);
  @ViewChild('export_template') tpl!: TemplateRef<{
    $implicit: ExportItem[];
  }>;

  private handleExport(ids: Set<string | number>) {

    const targets: ExportItem[] =  this.countries()
          .filter(c => ids.has(c.id))
          .map(c => ({
            id: c.id,
            name: c.name,
            notes: '',
          }));
    this.exportItems.set(targets);

    this.alert.showTemplate(
      this.tpl, 
      {
        message: '',
        title: 'Export info',
        showFooter: true,
        size: 'lg',
        showConfirmButton: true,
        context: { items: this.exportItems() },
        onConfirm: () => {
          const result = this.exportItems();

          this.notifications.info(
            JSON.stringify(result, null, 2),
            10000
          );
          console.log('EXPORT RESULT', result);
        },
      }
    );
  }

  getEntityName = () => this.i18n.t('country-table.entity-name');

}
