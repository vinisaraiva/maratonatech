// Função para salvar os dados no Local Storage
function salvarDados(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
}

// Função para carregar os dados do Local Storage
function carregarDados(chave) {
    return JSON.parse(localStorage.getItem(chave)) || [];
}

// Função para cadastrar sala
function cadastrarSala(event) {
    event.preventDefault();
    const sala = {
        nomeEspaco: document.getElementById('nomeEspaco').value,
        estrutura: document.getElementById('estrutura').value,
        valor: document.getElementById('valor').value,
        periodoMax: document.getElementById('periodoMax').value
    };
    const salas = carregarDados('salas');
    salas.push(sala);
    salvarDados('salas', salas);
    alert('Sala cadastrada com sucesso!');
    document.getElementById('formCadastroSalas').reset();
    atualizarTabelaSalas(); // Atualiza a tabela após o cadastro
}

// Função para atualizar a tabela de salas cadastradas
function atualizarTabelaSalas() {
    const salas = carregarDados('salas');
    const salasCadastradasEl = document.getElementById('salasCadastradas');
    if (!salasCadastradasEl) return; // Se o elemento não existir, não faça nada

    salasCadastradasEl.innerHTML = '';

    salas.forEach((sala, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sala.nomeEspaco}</td>
            <td>${sala.estrutura}</td>
            <td>R$ ${sala.valor}</td>
            <td>${sala.periodoMax} horas</td>
            <td>
                <button class="btn btn-warning btn-sm edit-btn" data-index="${index}">Editar</button>
                <button class="btn btn-danger btn-sm delete-btn" data-index="${index}">Excluir</button>
            </td>
        `;
        salasCadastradasEl.appendChild(row);
    });

    // Adiciona eventos de clique para os botões de editar e excluir
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            editarSala(index);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            excluirSala(index);
        });
    });
}

// Função para editar sala
function editarSala(index) {
    const salas = carregarDados('salas');
    const sala = salas[index];

    document.getElementById('editNomeEspaco').value = sala.nomeEspaco;
    document.getElementById('editEstrutura').value = sala.estrutura;
    document.getElementById('editValor').value = sala.valor;
    document.getElementById('editPeriodoMax').value = sala.periodoMax;
    document.getElementById('editIndex').value = index;

    $('#editModal').modal('show');
}

// Função para excluir sala
function excluirSala(index) {
    const confirmDelete = document.getElementById('confirmDelete');
    if (confirmDelete) {
        confirmDelete.setAttribute('data-index', index);
        $('#deleteModal').modal('show');
    }
}

// Função para salvar as alterações da edição
document.addEventListener('DOMContentLoaded', function() {
    const formCadastroSalas = document.getElementById('formCadastroSalas');
    const formEditarSala = document.getElementById('formEditarSala');

    if (formCadastroSalas) {
        formCadastroSalas.addEventListener('submit', cadastrarSala);
    }

    if (formEditarSala) {
        formEditarSala.addEventListener('submit', function(event) {
            event.preventDefault();
            const index = document.getElementById('editIndex').value;
            const salas = carregarDados('salas');

            salas[index].nomeEspaco = document.getElementById('editNomeEspaco').value;
            salas[index].estrutura = document.getElementById('editEstrutura').value;
            salas[index].valor = document.getElementById('editValor').value;
            salas[index].periodoMax = document.getElementById('editPeriodoMax').value;

            salvarDados('salas', salas);
            $('#editModal').modal('hide');
            alert('Sala editada com sucesso!');
            atualizarTabelaSalas(); // Atualiza a tabela após a edição
        });
    }

    const confirmDelete = document.getElementById('confirmDelete');
    if (confirmDelete) {
        confirmDelete.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const salas = carregarDados('salas');
            salas.splice(index, 1);

            salvarDados('salas', salas);
            $('#deleteModal').modal('hide');
            alert('Sala excluída com sucesso!');
            atualizarTabelaSalas(); // Atualiza a tabela após a exclusão
        });
    }

    // Atualiza a tabela ao carregar a página
    atualizarTabelaSalas();
});

// Função para carregar o calendário e horários disponíveis
function carregarCalendario() {
    const calendario = document.getElementById('calendario');
    const horariosDisponiveis = document.getElementById('horariosDisponiveis');
    if (calendario) {
        calendario.innerHTML = '';

        const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

        diasDaSemana.forEach((dia, index) => {
            const button = document.createElement('button');
            button.textContent = dia;
            button.className = 'btn btn-outline-primary m-1';
            button.onclick = () => mostrarHorariosDisponiveis(index);
            calendario.appendChild(button);
        });

        function mostrarHorariosDisponiveis(dia) {
            horariosDisponiveis.innerHTML = `<h2 class="mt-5">Horários disponíveis para ${diasDaSemana[dia]}</h2>`;
            const horarios = ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00'];
            horarios.forEach(horario => {
                const p = document.createElement('p');
                p.textContent = horario;
                horariosDisponiveis.appendChild(p);
            });
        }
    }
}

// Verificar se os formulários existem antes de adicionar os listeners
document.addEventListener('DOMContentLoaded', () => {
    const formCadastroUsuario = document.getElementById('formCadastroUsuario');
    const formLogin = document.getElementById('formLogin');

    if (formCadastroUsuario) {
        formCadastroUsuario.addEventListener('submit', cadastrarUsuario);
    }

    if (formLogin) {
        formLogin.addEventListener('submit', logarUsuario);
    }

    // Inicializa o calendário ao carregar a página
    if (document.getElementById('calendar')) {
        inicializarCalendario();
    }

    // Atualiza a tabela ao carregar a página
    if (document.getElementById('salasCadastradas')) {
        atualizarTabelaSalas();
    }
});
