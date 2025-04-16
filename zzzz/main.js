// main.js - Gestione filtri avanzata, badge, reset, search, meta hint e responsive

(function () {
	'use strict';

	// Stato centralizzato dei filtri
	const state = {
		search: '',
		status: 'none',
		priority: 'none',
		includeSections: false,
		hasNotes: false,
		meta: [],
		metaHints: [
			'Urgente', 'Bug', 'Refactoring', 'Frontend', 'Backend', 'API', 'Design',
			'Performance', 'Testing', 'Documentazione', 'UI', 'UX', 'DevOps', 'Security'
		]
	};

	// Elementi DOM principali
	const badge = document.getElementById('filterBadge');
	const resetBtn = document.getElementById('resetFilters');
	const searchBar = document.getElementById('searchBar');
	const statusSel = document.getElementById('status');
	const prioritySel = document.getElementById('priority');
	const includeSectionsChk = document.getElementById('includeSections');
	const hasNotesChk = document.getElementById('hasNotes');
	const metaInput = document.getElementById('metaInput');
	const metaDropdown = document.getElementById('metaHintDropdown');
	const metaSelectedList = document.getElementById('metaSelectedList');
	const resultsList = document.getElementById('resultsList');

	// --- Badge filtri attivi ---
	function updateFilterBadge() {
		let count = 0;
		if (state.search) count++;
		if (state.status !== 'none') count++;
		if (state.priority !== 'none') count++;
		if (state.includeSections) count++;
		if (state.hasNotes) count++;
		count += state.meta.length;
		badge.textContent = count;
		badge.style.background = count > 0 ? '#7e57c2' : '#353b45';
	}

	// --- Reset filtri ---
	function resetFilters() {
		searchBar.value = '';
		statusSel.value = 'none';
		prioritySel.value = 'none';
		includeSectionsChk.checked = false;
		hasNotesChk.checked = false;
		state.search = '';
		state.status = 'none';
		state.priority = 'none';
		state.includeSections = false;
		state.hasNotes = false;
		state.meta = [];
		metaInput.value = '';
		renderMetaSelected();
		hideMetaDropdown();
		updateFilterBadge();
		filterResults();
	}

	// --- Search bar ---
	searchBar.addEventListener('input', e => {
		state.search = e.target.value.trim();
		updateFilterBadge();
		filterResults();
	});

	// --- Select e checkbox ---
	statusSel.addEventListener('change', e => {
		state.status = e.target.value;
		updateFilterBadge();
		filterResults();
	});
	prioritySel.addEventListener('change', e => {
		state.priority = e.target.value;
		updateFilterBadge();
		filterResults();
	});
	includeSectionsChk.addEventListener('change', e => {
		state.includeSections = e.target.checked;
		updateFilterBadge();
		filterResults();
	});
	hasNotesChk.addEventListener('change', e => {
		state.hasNotes = e.target.checked;
		updateFilterBadge();
		filterResults();
	});

	// --- Reset ---
	resetBtn.addEventListener('click', resetFilters);

	// --- Meta hint dropdown ---
	metaInput.addEventListener('focus', showMetaDropdown);
	metaInput.addEventListener('mousedown', (e) => {
		// Se è già attivo, forza riapertura dropdown
		setTimeout(showMetaDropdown, 0);
	});
	metaInput.addEventListener('input', filterMetaHints);
	metaInput.addEventListener('keydown', e => {
		if (e.key === 'ArrowDown') {
			const first = metaDropdown.querySelector('.meta-hint-item');
			if (first) first.focus();
		}
	});
	document.addEventListener('click', e => {
		if (!metaDropdown.contains(e.target) && e.target !== metaInput) {
			hideMetaDropdown();
		}
	});

	function showMetaDropdown() {
		filterMetaHints();
		positionMetaDropdown();
		metaDropdown.classList.add('active');
	}
	function hideMetaDropdown() {
		metaDropdown.classList.remove('active');
	}
	function filterMetaHints() {
		const val = metaInput.value.trim().toLowerCase();
		metaDropdown.innerHTML = '';
		if (!val) {
			state.metaHints.forEach(hint => {
				if (!state.meta.includes(hint)) metaDropdown.appendChild(createHintItem(hint));
			});
		} else {
			state.metaHints.forEach(hint => {
				if (!state.meta.includes(hint) && hint.toLowerCase().includes(val)) {
					metaDropdown.appendChild(createHintItem(hint));
				}
			});
		}
		if (metaDropdown.children.length > 0) {
			metaDropdown.classList.add('active');
			positionMetaDropdown();
		} else {
			metaDropdown.classList.remove('active');
		}
	}
	function positionMetaDropdown() {
		// Calcola la posizione dell'input meta rispetto al viewport
		const rect = metaInput.getBoundingClientRect();
		metaDropdown.style.left = rect.left + 'px';
		metaDropdown.style.top = (rect.bottom + window.scrollY) + 'px';
		metaDropdown.style.width = rect.width + 'px';
	}

	function createHintItem(text) {
		const div = document.createElement('div');
		div.className = 'meta-hint-item';
		div.tabIndex = 0;
		div.textContent = text;
		div.setAttribute('role', 'option');
		div.onclick = () => addMeta(text);
		div.onkeydown = e => {
			if (e.key === 'Enter' || e.key === ' ') addMeta(text);
		};
		return div;
	}
	function addMeta(text) {
		if (!state.meta.includes(text)) {
			state.meta.push(text);
			// Crea solo il nuovo box e aggiungilo
			const box = createMetaBox(text);
			metaSelectedList.appendChild(box);
			updateFilterBadge();
			filterResults();
			updatePanelHeightIfExpanded();
			// Applica animazione fade-in
			requestAnimationFrame(() => box.classList.add('meta-fade-in'));
		}
		metaInput.value = '';
		metaInput.focus();
		filterMetaHints();
	}

	function createMetaBox(meta) {
		const box = document.createElement('span');
		box.className = 'meta-selected-box';
		const circle = document.createElement('span');
		circle.className = 'meta-selected-circle';
		box.appendChild(circle);
		box.appendChild(document.createTextNode(meta));
		const remove = document.createElement('button');
		remove.className = 'meta-selected-remove';
		remove.type = 'button';
		remove.setAttribute('aria-label', `Rimuovi filtro ${meta}`);
		remove.innerHTML = '×';
		remove.onclick = () => {
			state.meta = state.meta.filter(m => m !== meta);
			// Rimuovi solo il nodo corrispondente con animazione fade-out
			box.classList.remove('meta-fade-in');
			box.classList.add('meta-fade-out');
			setTimeout(() => {
				if (box.parentNode) box.parentNode.removeChild(box);
				updateFilterBadge();
				filterResults();
				updatePanelHeightIfExpanded();
			}, 180);
		};
		box.appendChild(remove);
		return box;
	}

	function renderMetaSelected() {
		// Solo in fase di reset (reset filtri): svuota e ricostruisci
		metaSelectedList.innerHTML = '';
		state.meta.forEach(meta => {
			const box = createMetaBox(meta);
			metaSelectedList.appendChild(box);
			requestAnimationFrame(() => box.classList.add('meta-fade-in'));
		});
	}

	// --- Filtraggio risultati (mock, da integrare con dati reali) ---
	function filterResults() {
		// Esempio: filtra i nodi in base a search/meta
		const items = Array.from(resultsList.querySelectorAll('li'));
		items.forEach(li => {
			const text = li.textContent.toLowerCase();
			let visible = true;
			if (state.search && !text.includes(state.search.toLowerCase())) visible = false;
			if (state.meta.length > 0 && !state.meta.some(m => text.includes(m.toLowerCase()))) visible = false;
			li.style.display = visible ? '' : 'none';
		});
	}

	// --- Responsive: chiusura/apertura filtri su mobile ---
	const toggleBtn = document.getElementById('toggleFilters');
	const wrapper = document.getElementById('filterWrapper');
	let expanded = false;

	function setPanelHeight(open) {
		if (open) {
			// Aggiorna maxHeight dinamicamente in base al contenuto
			wrapper.style.maxHeight = wrapper.scrollHeight + "px";
		} else {
			wrapper.style.maxHeight = "0";
		}
	}

	toggleBtn.addEventListener("click", () => {
		expanded = !expanded;
		setPanelHeight(expanded);
		toggleBtn.setAttribute('aria-expanded', expanded);
	});

	window.addEventListener('DOMContentLoaded', () => setPanelHeight(expanded));

	// --- Aggiorna maxHeight wrapper quando cambia il contenuto dinamico (es. meta) ---
	function updatePanelHeightIfExpanded() {
		if (expanded) setPanelHeight(true);
	}

	// --- Inizializzazione ---
	updateFilterBadge();
	renderMetaSelected();
	filterResults();

})();
