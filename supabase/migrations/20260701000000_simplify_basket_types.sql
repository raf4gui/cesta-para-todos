-- Migration: 20260701000000_simplify_basket_types.sql
-- Description: Ensures baskets_tipo_check includes all 6 current types (CESTA_PRATICA, CESTA_COMPLETA, CESTAO_FAMILIA, CESTA_PERSONALIZADA, KIT, FARDO)

alter table baskets drop constraint if exists baskets_tipo_check;
update baskets set tipo = 'CESTA_PRATICA' where tipo not in ('CESTA_PRATICA','CESTA_COMPLETA','CESTAO_FAMILIA','CESTA_PERSONALIZADA','KIT','FARDO');
alter table baskets add constraint baskets_tipo_check
  check (tipo in ('CESTA_PRATICA','CESTA_COMPLETA','CESTAO_FAMILIA','CESTA_PERSONALIZADA','KIT','FARDO'));
