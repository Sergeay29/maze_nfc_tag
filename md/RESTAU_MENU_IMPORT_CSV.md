# Import d’un menu Restau par CSV

L’import se fait depuis **Menu digital > Importer un menu CSV**. Le menu reste en brouillon après l’import.

## Colonnes

Colonnes obligatoires :

- `category` : nom de la catégorie
- `item` : nom du plat
- `price` : prix en FCFA, sans séparateur de milliers

Colonnes facultatives :

- `categoryDescription`, `categoryOrder`
- `itemDescription`, `itemOrder`, `itemAvailable`
- `optionGroup`, `optionGroupType` (`single` ou `multiple`), `optionGroupMin`, `optionGroupMax`
- `option`, `optionPrice`, `optionOrder`, `optionAvailable`

Une ligne représente un plat. Pour ajouter plusieurs choix au même groupe, répéter la catégorie, le plat et le groupe sur plusieurs lignes.

```csv
category,item,price,itemDescription,optionGroup,optionGroupType,optionGroupMin,optionGroupMax,option,optionPrice
Entrées,Poulet braisé,3500,Servi avec sauce,Accompagnement,single,1,1,Riz,0
Entrées,Poulet braisé,3500,Servi avec sauce,Accompagnement,single,1,1,Alloco,500
Plats,Poisson braisé,5000,,Suppléments,multiple,0,3,Avocat,750
```

L’import est transactionnel et met à jour les catégories, plats, groupes et choix portant le même nom dans le menu courant. Il est refusé si le menu est publié : repasser en brouillon avant l’import.
