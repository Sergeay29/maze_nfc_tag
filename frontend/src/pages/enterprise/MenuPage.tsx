import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, Pencil, Plus, Trash2, Utensils, X } from 'lucide-react';
import { Badge, Button, Card, Input, Toast } from '../../components';
import {
  createMenuCategory,
  createMenuItem,
  createRestaurantMenu,
  deleteMenuCategory,
  deleteMenuItem,
  getRestaurantMenu,
  updateMenuCategory,
  updateMenuItem,
  updateRestaurantMenu,
} from '../../api/restaurantMenuApi';
import type {
  RestaurantMenu,
  RestaurantMenuCategory,
  RestaurantMenuItem,
} from '../../api/restaurantMenuApi';
import { uploadFile } from '../../api/enterpriseApi';

const EMPTY_CATEGORY = { name: '', description: '' };
type ItemFormState = {
  name: string;
  description: string;
  priceMinor: number | '';
  imageUrl: string;
  imageFile: File | null;
};

const EMPTY_ITEM: ItemFormState = { name: '', description: '', priceMinor: '', imageUrl: '', imageFile: null };

const formatPrice = (priceMinor: number) =>
  `${new Intl.NumberFormat('fr-FR').format(priceMinor)} FCFA`;

const MenuPage: React.FC = () => {
  const [menu, setMenu] = useState<RestaurantMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_ITEM);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemCategoryId, setItemCategoryId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const nextMenu = await getRestaurantMenu();
      setMenu(nextMenu);
      setShowCategoryForm((current) => Boolean(nextMenu && (nextMenu.categories.length === 0 || current)));
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'Impossible de charger le menu', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMenu();
  }, []);

  const handleCreateMenu = async () => {
    try {
      setSaving(true);
      const createdMenu = await createRestaurantMenu();
      setMenu({ ...createdMenu, categories: [] });
      setShowCategoryForm(true);
      setToast({ message: 'Menu créé. Ajoutez maintenant vos catégories.', variant: 'success' });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'Impossible de créer le menu', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!menu) return;
    try {
      setSaving(true);
      const nextStatus = menu.status === 'published' ? 'draft' : 'published';
      setMenu({ ...menu, ...(await updateRestaurantMenu(menu.id, { status: nextStatus })) });
      setToast({ message: nextStatus === 'published' ? 'Menu publié côté client.' : 'Menu repassé en brouillon.', variant: 'success' });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'Impossible de modifier le statut du menu', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm(EMPTY_CATEGORY);
    setEditingCategoryId(null);
    setShowCategoryForm(false);
  };

  const resetItemForm = () => {
    setItemForm(EMPTY_ITEM);
    setEditingItemId(null);
    setItemCategoryId(null);
    setImagePreview(null);
  };

  const handleCategorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!menu || !categoryForm.name.trim()) return;

    try {
      setSaving(true);
      if (editingCategoryId) {
        await updateMenuCategory(editingCategoryId, categoryForm);
        setToast({ message: 'Catégorie mise à jour.', variant: 'success' });
      } else {
        await createMenuCategory(menu.id, categoryForm);
        setToast({ message: 'Catégorie ajoutée.', variant: 'success' });
      }
      resetCategoryForm();
      await loadMenu();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'Impossible d’enregistrer la catégorie', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleItemSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!itemCategoryId || !itemForm.name.trim() || itemForm.priceMinor === '' || itemForm.priceMinor < 0) return;

    try {
      setSaving(true);
      const imageUrl = itemForm.imageFile ? await uploadFile(itemForm.imageFile) : itemForm.imageUrl || null;
      const itemPayload = {
        name: itemForm.name,
        description: itemForm.description,
        priceMinor: Number(itemForm.priceMinor),
        imageUrl,
      };
      if (editingItemId) {
        await updateMenuItem(editingItemId, itemPayload);
        setToast({ message: 'Plat mis à jour.', variant: 'success' });
      } else {
        await createMenuItem(itemCategoryId, itemPayload);
        setToast({ message: 'Plat ajouté.', variant: 'success' });
      }
      resetItemForm();
      await loadMenu();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'Impossible d’enregistrer le plat', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const editCategory = (category: RestaurantMenuCategory) => {
    setCategoryForm({ name: category.name, description: category.description || '' });
    setEditingCategoryId(category.id);
    setShowCategoryForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editItem = (categoryId: string, item: RestaurantMenuItem) => {
    setItemCategoryId(categoryId);
    setEditingItemId(item.id);
    setItemForm({
      name: item.name,
      description: item.description || '',
      priceMinor: item.priceMinor,
      imageUrl: item.imageUrl || '',
      imageFile: null,
    });
    setImagePreview(item.imageUrl || null);
  };

  const handleItemImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setToast({ message: 'Format accepté : JPG, PNG, WEBP ou GIF.', variant: 'error' });
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'La photo ne doit pas dépasser 5 Mo.', variant: 'error' });
      event.target.value = '';
      return;
    }

    setItemForm((current) => ({ ...current, imageFile: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDeleteCategory = async (category: RestaurantMenuCategory) => {
    if (!window.confirm(`Supprimer la catégorie « ${category.name} » et ses plats ?`)) return;
    try {
      await deleteMenuCategory(category.id);
      await loadMenu();
      setToast({ message: 'Catégorie supprimée.', variant: 'success' });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'Impossible de supprimer la catégorie', variant: 'error' });
    }
  };

  const handleDeleteItem = async (item: RestaurantMenuItem) => {
    if (!window.confirm(`Supprimer le plat « ${item.name} » ?`)) return;
    try {
      await deleteMenuItem(item.id);
      await loadMenu();
      setToast({ message: 'Plat supprimé.', variant: 'success' });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'Impossible de supprimer le plat', variant: 'error' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-dark">Menu digital</h1>
          <p className="text-slate mt-1">Gérez les catégories, les plats et leur disponibilité.</p>
        </div>
        {menu && (
          <Button onClick={handlePublish} disabled={saving} icon={menu.status === 'published' ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}>
            {menu.status === 'published' ? 'Repasser en brouillon' : 'Publier le menu'}
          </Button>
        )}
      </div>

      {!menu ? (
        <Card className="text-center py-14">
          <Utensils className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-dark">Votre menu est prêt à être créé</h2>
          <p className="text-slate mt-2 mb-6">Créez le menu principal de votre restaurant pour commencer.</p>
          <Button onClick={handleCreateMenu} disabled={saving} icon={<Plus className="w-5 h-5" />}>Créer le menu</Button>
        </Card>
      ) : (
        <>
          <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate">Menu actif</p>
              <h2 className="text-xl font-semibold text-dark">{menu.name}</h2>
            </div>
            <Badge variant={menu.status === 'published' ? 'success' : 'warning'}>
              {menu.status === 'published' ? 'Publié' : 'Brouillon'}
            </Badge>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
            <div className="space-y-4">
              {menu.categories.map((category) => (
                <Card key={category.id} padding="none" className="overflow-hidden">
                  <div className="p-5 border-b border-slate/10 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-dark">{category.name}</h3>
                      {category.description && <p className="text-sm text-slate mt-1">{category.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => editCategory(category)} icon={<Pencil className="w-4 h-4" />} />
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => void handleDeleteCategory(category)} icon={<Trash2 className="w-4 h-4" />} />
                    </div>
                  </div>
                  <div className="divide-y divide-slate/10">
                    {category.items.map((item) => (
                      <div key={item.id} className="p-4 flex items-center gap-4">
                        {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover" /> : <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center"><Utensils className="w-6 h-6 text-primary" /></div>}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2"><h4 className="font-medium text-dark">{item.name}</h4>{!item.isAvailable && <Badge variant="warning">Indisponible</Badge>}</div>
                          {item.description && <p className="text-sm text-slate truncate mt-1">{item.description}</p>}
                          <p className="text-sm font-semibold text-primary mt-1">{formatPrice(item.priceMinor)}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => editItem(category.id, item)} icon={<Pencil className="w-4 h-4" />} />
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => void handleDeleteItem(item)} icon={<Trash2 className="w-4 h-4" />} />
                        </div>
                      </div>
                    ))}
                    {category.items.length === 0 && <p className="p-5 text-sm text-slate">Aucun plat dans cette catégorie.</p>}
                  </div>
                  <button type="button" onClick={() => { resetItemForm(); setItemCategoryId(category.id); }} className="w-full p-4 text-sm font-medium text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Ajouter un plat</button>
                </Card>
              ))}
              {menu.categories.length === 0 && <Card className="text-center py-10"><p className="text-slate">Ajoutez votre première catégorie à droite.</p></Card>}
            </div>

            <div className="space-y-4 xl:sticky xl:top-6">
              {showCategoryForm || editingCategoryId ? (
              <Card>
                <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-dark">{editingCategoryId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>{editingCategoryId && <Button size="sm" variant="ghost" onClick={resetCategoryForm} icon={<X className="w-4 h-4" />} />}</div>
                <form onSubmit={handleCategorySubmit} className="space-y-3">
                  <Input value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} placeholder="Ex. Entrées" required />
                  <Input as="textarea" rows={2} value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} placeholder="Description (facultatif)" />
                  <Button type="submit" fullWidth disabled={saving}>{editingCategoryId ? 'Enregistrer' : 'Ajouter la catégorie'}</Button>
                </form>
              </Card>
              ) : (
                <Card className="border border-dashed border-primary/30 bg-primary/5">
                  <Button type="button" fullWidth onClick={() => setShowCategoryForm(true)} icon={<Plus className="w-5 h-5" />}>Ajouter une catégorie</Button>
                </Card>
              )}

              {itemCategoryId && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="item-modal-title" onMouseDown={(event) => { if (event.target === event.currentTarget) resetItemForm(); }}>
                <Card className="relative z-10 w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl">
                  <div className="flex items-center justify-between mb-4"><h2 id="item-modal-title" className="font-semibold text-dark">{editingItemId ? 'Modifier le plat' : 'Nouveau plat'}</h2><Button size="sm" variant="ghost" onClick={resetItemForm} icon={<X className="w-4 h-4" />} /></div>
                  <form onSubmit={handleItemSubmit} className="space-y-3">
                    <Input value={itemForm.name} onChange={(event) => setItemForm({ ...itemForm, name: event.target.value })} placeholder="Nom du plat" required />
                    <Input as="textarea" rows={2} value={itemForm.description} onChange={(event) => setItemForm({ ...itemForm, description: event.target.value })} placeholder="Description (facultatif)" />
                    <Input label="Prix du plat (FCFA)" type="number" min="0" value={itemForm.priceMinor} onChange={(event) => setItemForm({ ...itemForm, priceMinor: event.target.value === '' ? '' : Number(event.target.value) })} placeholder="Ex. 2500" required />
                    <div className="space-y-2">
                      <label htmlFor="menu-item-image" className="block text-sm font-medium text-dark">Photo du plat (facultatif)</label>
                      <input id="menu-item-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleItemImageChange} className="block w-full rounded-xl border border-slate/20 bg-white px-3 py-2 text-sm text-slate file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-medium file:text-primary hover:file:bg-primary/20" />
                      {itemForm.imageFile && <p className="text-xs text-slate truncate">Fichier sélectionné : {itemForm.imageFile.name}</p>}
                      {imagePreview && <div className="space-y-1"><p className="text-xs font-medium text-dark">Aperçu</p><img src={imagePreview} alt="Aperçu de la photo du plat" className="h-32 w-full rounded-xl object-cover" /></div>}
                    </div>
                    <Button type="submit" fullWidth disabled={saving}>{editingItemId ? 'Enregistrer' : 'Ajouter le plat'}</Button>
                  </form>
                </Card>
                </div>, document.body)}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MenuPage;
