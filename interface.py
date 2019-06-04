import os
from neuralmonkey.experiment import Experiment

from config_analyzer import config_infer
from dataset import merge_datasets

class ModelInterface:
    def __init__(self):
        raise NotImplementedError()

    def initialize(self):
        raise NotImplementedError()

    def run_on_dataset(self, dataset):
        results = []
        for batch in dataset:
            b = self.format_batch(batch)
            out = self.run_on_batch(b)
            results.extend(out)
        out = self.reconstruct_dataset(results)
        d = merge_datasets(dataset, out)
        return (d, out)

    def format_batch(self, batch):
        """Processes the batch into a form acceptable by the model.
        """
        raise NotImplementedError()

    def run_on_batch(self, batch):
        """Runs the model on the batch
        """
        raise NotImplementedError()

    def reconstruct_dataset(self, data):
        raise NotImplementedError()

class NeuralMonkeyModelInterface(ModelInterface):
    def __init__(self, config_path, vars_path):
        if not os.path.isfile(config_path):
            raise ValueError("File {} does not exist.".format(config_path))
        if not os.path.isfile(vars_path):
            raise ValueError("File {} does not exist".format(vars_path))
        
        self._config_path = config_path

        self._img_series = ""
        self._img_reader = ""
        self._ref_series = ""
        self._src_cap_series = ""

        # try to infere the correspondence between data and model inputs
        concl_dict = config_infer(config_path)
        if concl_dict['images'] is not None:
            self._img_series = concl_dict['images']['series']
            self._img_reader = concl_dict['images']['reader']
        if concl_dict['source_captions'] is not None:
            self._src_cap_series = concl_dict['src_captions']
        if concl_dict['references'] is not None:
            self._ref_series = concl_dict['references']

        # potentially remove dataset sections from the config

        self._exp = Experiment(config_path=config_path)
        self._exp.build_model()
        self._exp.load_variables([vars_path])